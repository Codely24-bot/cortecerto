// Transpiles the PostgreSQL-flavoured SQL used by this app into SQLite-compatible SQL.
// Since this is a local in-memory mock, params are inlined with proper escaping.

function escapeLiteral(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  if (Array.isArray(value)) {
    return value.map((v) => escapeLiteral(v)).join(",");
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function findClosingParen(str, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < str.length; i += 1) {
    if (str[i] === "(") depth += 1;
    else if (str[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function matchBalanced(str, regex) {
  const m = regex.exec(str);
  if (!m) return null;
  return { match: m, index: m.index };
}

// Replace FIRST occurrence of `from` (exact string) with `to` starting at `start`.
function replaceAt(str, start, end, repl) {
  return str.slice(0, start) + repl + str.slice(end);
}

// find last index of a marker from a position
function transpileDateTruncs(sql) {
  // date_trunc('month', X)  -> substr(X,1,7)
  let out = sql;
  const re = /date_trunc\s*\(\s*'([^']+)'\s*,\s*([^)]*?)\s*\)/gi;
  let m;
  while ((m = re.exec(out)) !== null) {
    const part = m[1];
    const arg = m[2].trim();
    const repl =
      part === "month" ? `substr(${arg},1,7)` : `substr(${arg},1,4)`;
    out = out.slice(0, m.index) + repl + out.slice(m.index + m[0].length);
    re.lastIndex = m.index + repl.length;
  }
  return out;
}

function transpileToChar(sql) {
  // TO_CHAR(X, 'YYYY-MM-DD') -> substr(X,1,10) ; TO_CHAR(X, 'YYYY-MM-DD') etc
  let out = sql;
  const re = /to_char\s*\(\s*([^,()]*?)\s*,\s*'([^']*)'\s*\)/gi;
  let m;
  while ((m = re.exec(out)) !== null) {
    const arg = m[1].trim();
    let repl = `substr(${arg},1,10)`;
    const fmt = m[2];
    if (fmt.includes("DD/MM")) {
      repl = `substr(${arg},9,2)||'/'||substr(${arg},6,2)||'/'||substr(${arg},1,4)`;
    } else if (fmt === "HH24:MI") {
      repl = `substr(${arg},12,5)`;
    }
    out = out.slice(0, m.index) + repl + out.slice(m.index + m[0].length);
    re.lastIndex = m.index + repl.length;
  }
  return out;
}

function transpileInterval(sql) {
  // X + INTERVAL 'N unit'  -> date(X, '+N unit')
  let out = sql;
  const re = /([$\w.]+)(?:\s*::\s*\w+)?\s*\+\s*interval\s*'([^']*)'/gi;
  let m;
  while ((m = re.exec(out)) !== null) {
    const base = m[1];
    const intervalVal = m[2];
    const baseExpr = /\bcurrent_date\b/i.test(base)
      ? "date('now')"
      : `${base}`;
    const repl = `date(${baseExpr}, '${intervalVal.trim()}')`;
    out = out.slice(0, m.index) + repl + out.slice(m.index + m[0].length);
    re.lastIndex = m.index + repl.length;
  }
  return out;
}

function transpileMakeInterval(sql) {
  // X + make_interval(days => N)  -> date(X, '+'||N||' days')
  let out = sql;
  const re = /([$\w.]+)(?:\s*::\s*\w+)?\s*\+\s*make_interval\s*\(\s*days\s*=>\s*([^)]*?)\s*\)/gi;
  let m;
  while ((m = re.exec(out)) !== null) {
    const base = m[1];
    const days = m[2].trim();
    const repl = `date(${base}, '+'||${days}||' days')`;
    out = out.slice(0, m.index) + repl + out.slice(m.index + m[0].length);
    re.lastIndex = m.index + repl.length;
  }
  return out;
}

function transpileCurrentDateAndNow(sql) {
  let out = sql.replace(/\bCURRENT_DATE\b/gi, "date('now')");
  out = out.replace(/NOW\s*\(\s*\)/gi, "datetime('now')");
  return out;
}

function transpileAny(sql, params) {
  // col = ANY($N::date[])  -> col IN (...)
  let out = sql;
  const re = /([\w.]+)\s*=\s*ANY\s*\(\s*\$(\d+)\s*::\s*date\s*\[\s*\]\s*\)/gi;
  let m;
  while ((m = re.exec(out)) !== null) {
    const col = m[1];
    const idx = Number(m[2]) - 1;
    const arr = params[idx] || [];
    const literal = arr.map((v) => escapeLiteral(v)).join(",");
    const repl = `${col} IN (${literal})`;
    out = out.slice(0, m.index) + repl + out.slice(m.index + m[0].length);
    re.lastIndex = m.index + repl.length;
  }
  return out;
}

function transpileFilters(sql) {
  // COUNT(...) FILTER (WHERE w) / SUM(x) FILTER (WHERE w)
  // -> COUNT(CASE WHEN w THEN 1 END) / SUM(CASE WHEN w THEN x ELSE 0 END)
  let out = sql;
  const re = /\b(\w+)\s*\(\s*((?:[^()]*|\((?:[^()]*|\([^()]*\))*\))*?)\s*\)\s*FILTER\s*\(\s*WHERE\s*/gi;
  // We use a manual scanner instead for reliability:
  out = filterScanner(sql);
  return out;
}

function filterScanner(sql) {
  const out = [];
  let i = 0;
  while (i < sql.length) {
    const idx = sql.indexOf("FILTER", i);
    if (idx === -1) {
      out.push(sql.slice(i));
      break;
    }
    // find OPEN ( of aggr before FILTER: scan backwards to matching open paren
    let j = idx - 1;
    while (j >= 0 && /\s/.test(sql[j])) j -= 1;
    if (j < 0 || sql[j] !== ")") {
      out.push(sql.slice(idx));
      i = idx + 6;
      continue;
    }
    // find matching open paren for sql[j]
    let depth = 0;
    let openIdx = -1;
    for (let k = j; k >= 0; k -= 1) {
      if (sql[k] === ")") depth += 1;
      else if (sql[k] === "(") {
        depth -= 1;
        if (depth === 0) {
          openIdx = k;
          break;
        }
      }
    }
    if (openIdx === -1) {
      out.push(sql.slice(idx));
      i = idx + 6;
      continue;
    }
    // extract function name before openIdx
    let nameStart = openIdx - 1;
    while (nameStart >= 0 && /[A-Za-z0-9_]/.test(sql[nameStart])) nameStart -= 1;
    const fnName = sql.slice(nameStart + 1, openIdx).toLowerCase();
    // push text from previous point up to the function name (exclusive), removing the agg call
    out.push(sql.slice(i, nameStart + 1));
    const aggrInner = sql.slice(openIdx + 1, j);
    // parse FILTER ( WHERE ... )  -> find closing paren of the FILTER open
    const filterOpenIdx = sql.indexOf("(", idx + 6);
    const filterCloseIdx = findClosingParen(sql, filterOpenIdx);
    const whereText = sql.slice(sql.indexOf("WHERE", filterOpenIdx) + 5, filterCloseIdx).trim();
    const aggrInnerTrim = aggrInner.trim();
    const isStar = aggrInnerTrim === "*";
    let repl;
    if (fnName === "count") {
      repl = isStar
        ? `COUNT(CASE WHEN ${whereText} THEN 1 END)`
        : `COUNT(CASE WHEN ${whereText} THEN ${aggrInnerTrim} END)`;
    } else if (fnName === "sum") {
      repl = `SUM(CASE WHEN ${whereText} THEN ${aggrInnerTrim} ELSE 0 END)`;
    } else {
      repl = `${fnName}(${aggrInnerTrim})`; // fallback, drop filter
    }
    out.push(repl);
    i = filterCloseIdx + 1;
  }
  return out.join("");
}

function transpileCasts(sql) {
  let out = sql;
  out = out.replace(/::\s*date\s*\[\s*\]/gi, ""); // [] handled by ANY, remove leftovers
  out = out.replace(/::\s*date/gi, "");
  out = out.replace(/::\s*int/gi, "");
  out = out.replace(/::\s*bigint/gi, "");
  out = out.replace(/::\s*text/gi, "");
  out = out.replace(/::\s*timestamp/gi, "");
  out = out.replace(/::\s*integer/gi, "");
  return out;
}

function transpileGreatest(sql) {
  let out = sql;
  out = out.replace(/GREATEST\s*\(/gi, "max(");
  return out;
}

function transpileConcat(sql) {
  let out = sql;
  const re = /\bCONCAT\s*\(/gi;
  let m;
  while ((m = re.exec(out)) !== null) {
    const openIdx = out.indexOf("(", m.index);
    const closeIdx = findClosingParen(out, openIdx);
    const inner = out.slice(openIdx + 1, closeIdx);
    // split top-level commas
    const args = splitTopLevel(inner);
    const joined = args.map((a) => `COALESCE(${a.trim()},'')`).join("||");
    out = out.slice(0, m.index) + "(" + joined + ")" + out.slice(closeIdx + 1);
    re.lastIndex = m.index + joined.length + 2;
  }
  return out;
}

function splitTopLevel(str) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of str) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  parts.push(cur);
  return parts;
}

function transpileOnConflict(sql) {
  // SQLite supports ON CONFLICT(col) DO UPDATE SET col=excluded.col within INSERT
  // The Postgres `ON CONFLICT (agendamento_id) DO UPDATE SET ...` matches SQLite syntax
  // but ensure commas/trailing ; handled. No transformation needed.
  return sql;
}

function inlineParams(sql, params) {
  const re = /\$(\d+)/g;
  let out = sql.replace(re, (full, n) => escapeLiteral(params[Number(n) - 1]));
  return out;
}

function stripTrailingSemicolon(sql) {
  return sql.replace(/;\s*$/, "");
}

function normalizeSelect(s) {
  return s.trim();
}

function transpile(sql, params = []) {
  let out = sql;
  out = transpileDateTruncs(out);
  out = transpileToChar(out);
  out = transpileInterval(out);
  out = transpileMakeInterval(out);
  out = transpileCurrentDateAndNow(out);
  out = transpileAny(out, params);
  out = transpileFilters(out);
  out = transpileCasts(out);
  out = transpileGreatest(out);
  out = transpileConcat(out);
  out = transpileOnConflict(out);
  out = inlineParams(out, params);
  out = stripTrailingSemicolon(out);
  return normalizeSelect(out);
}

export { transpile, escapeLiteral };
