#!/usr/bin/env python3
"""Render the English edition of the index benchmark report.

Reads reports/benchmark-results.json, writes:
  reports/optimization-report-en.html
  reports/optimization-report-en.md

Reuses the chart styling and numeric helpers from make_report.py.
"""

from __future__ import annotations

import html
import json
import math
import re
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from make_report import CSS, fmt_ms, fmt_speed, order_queries, plan_changed, verdict

ROOT = Path(__file__).resolve().parent.parent
REPORT_DIR = ROOT / "reports"
DATA = REPORT_DIR / "benchmark-results.json"

EN_LABELS = {
    "my_mitigation": "My mitigation requests",
    "teaching_roster": "Teaching roster",
    "ticket_active": "Active time ticket",
    "course_teachers": "Teachers by course",
    "programme_students": "Students by programme",
    "transcript": "Student transcript",
    "staff_list": "Staff list",
    "syllabus": "Programme syllabus",
    "course_catalog": "Course catalog",
    "my_overload": "My overload requests",
    "login": "Login lookup",
    "not_enrolled_major": "Students without major",
    "all_mitigation": "All mitigation requests",
}


def esc(value) -> str:
    return html.escape(str(value), quote=True)


def plan_summary(query: dict) -> str:
    if not plan_changed(query):
        return "unchanged"
    indexed = query["plan_indexed"]
    names = list(dict.fromkeys(re.findall(r"USING (?:COVERING )?INDEX (\w+)", indexed)))
    new_names = [name for name in names if name.startswith("idx_")]
    if re.search(r"SCAN \w+ USING (?:COVERING )?INDEX", indexed) and new_names:
        return f"index scan ({new_names[0]})"
    if "SEARCH" in indexed and new_names:
        return f"index lookup ({' / '.join(new_names)})"
    if names:
        return f"index lookup ({names[0]})"
    return "plan changed"


def build_svg(results: list[dict]) -> str:
    width, height = 1120, 518
    left, right = 250, 150
    top, row_height = 30, 34
    rows = len(results)
    plot_bottom = top + rows * row_height
    domain_min, domain_max = 0.005, 60.0
    log_min, log_max = math.log10(domain_min), math.log10(domain_max)
    plot_width = width - left - right

    def x_scale(value: float) -> float:
        value = max(domain_min, min(domain_max, value))
        return left + (math.log10(value) - log_min) / (log_max - log_min) * plot_width

    parts = [
        f'<svg class="chart" viewBox="0 0 {width} {height}" role="list" '
        f'aria-label="Median query latency before and after indexing, log scale">'
    ]
    for tick in (0.01, 0.1, 1, 10):
        x = x_scale(tick)
        parts.append(
            f'<line class="grid" x1="{x:.1f}" y1="{top - 6}" '
            f'x2="{x:.1f}" y2="{plot_bottom}"/>'
        )
        parts.append(
            f'<text class="tick" x="{x:.1f}" y="{plot_bottom + 22}" '
            f'text-anchor="middle">{tick:g}</text>'
        )
    parts.append(
        f'<line class="axis" x1="{left}" y1="{plot_bottom}" '
        f'x2="{width - right}" y2="{plot_bottom}"/>'
    )
    parts.append(
        f'<text class="axis-title" x="{left}" y="{plot_bottom + 42}">'
        f"Median latency (ms, log scale)</text>"
    )

    for row_index, query in enumerate(results):
        y = top + row_index * row_height + row_height / 2
        before = query["baseline"]["p50_ms"]
        after = query["indexed"]["p50_ms"]
        x_before, x_after = x_scale(before), x_scale(after)
        kind = verdict(query)
        label = EN_LABELS.get(query["id"], query["label"])
        speed = fmt_speed(query["speedup_p50"])
        tooltip = (
            f"{label} | {query['source']} | before p50 {fmt_ms(before)} ms, "
            f"p95 {fmt_ms(query['baseline']['p95_ms'])} ms | after p50 "
            f"{fmt_ms(after)} ms, p95 {fmt_ms(query['indexed']['p95_ms'])} ms | "
            f"{speed}x | {plan_summary(query)}"
        )
        parts.append(
            f'<g class="row {kind}" tabindex="0" role="listitem" '
            f'aria-label="{esc(tooltip)}" data-label="{esc(label)}" '
            f'data-source="{esc(query["source"])}" '
            f'data-before="{fmt_ms(before)}" data-before-p95="{fmt_ms(query["baseline"]["p95_ms"])}" '
            f'data-after="{fmt_ms(after)}" data-after-p95="{fmt_ms(query["indexed"]["p95_ms"])}" '
            f'data-speed="{speed}" data-plan="{esc(plan_summary(query))}">'
        )
        parts.append(
            f'<rect class="hit" x="0" y="{y - row_height / 2:.1f}" '
            f'width="{width}" height="{row_height}" rx="6"/>'
        )
        parts.append(
            f'<line class="connector" x1="{x_before:.1f}" y1="{y:.1f}" '
            f'x2="{x_after:.1f}" y2="{y:.1f}"/>'
        )
        parts.append(f'<circle class="dot before" cx="{x_before:.1f}" cy="{y:.1f}" r="5.5"/>')
        parts.append(f'<circle class="dot after" cx="{x_after:.1f}" cy="{y:.1f}" r="6.5"/>')
        parts.append(
            f'<text class="row-label" x="{left - 14}" y="{y + 4.5:.1f}" '
            f'text-anchor="end">{esc(label)}</text>'
        )
        parts.append(
            f'<text class="speed {kind}" x="{width - 24}" y="{y + 4.5:.1f}" '
            f'text-anchor="end">{speed}x</text>'
        )
        if query["id"] in {"my_mitigation", "teaching_roster"}:
            parts.append(
                f'<text class="dlabel" x="{x_after + 11:.1f}" y="{y - 8:.1f}">'
                f"{fmt_ms(after)} ms</text>"
            )
        parts.append("</g>")
    parts.append("</svg>")
    return "".join(parts)


EN_JS = """
(function () {
  var root = document.documentElement;
  var button = document.getElementById('theme-toggle');
  function current() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function paint(mode) {
    root.dataset.theme = mode;
    button.textContent = mode === 'dark' ? 'Light' : 'Dark';
  }
  try {
    var saved = localStorage.getItem('amp-theme');
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  } catch (error) {}
  button.textContent = current() === 'dark' ? 'Light' : 'Dark';
  button.addEventListener('click', function () {
    var mode = current() === 'dark' ? 'light' : 'dark';
    paint(mode);
    try { localStorage.setItem('amp-theme', mode); } catch (error) {}
  });

  var tip = document.getElementById('tip');
  function addRow(parent, label, value) {
    var row = document.createElement('div');
    row.className = 'tip-row';
    var left = document.createElement('span');
    left.textContent = label;
    var right = document.createElement('span');
    right.textContent = value;
    row.appendChild(left);
    row.appendChild(right);
    parent.appendChild(row);
  }
  function show(row, x, y) {
    var data = row.dataset;
    tip.innerHTML = '';
    var title = document.createElement('div');
    title.className = 'tip-title';
    title.textContent = data.label;
    var source = document.createElement('div');
    source.className = 'tip-src';
    source.textContent = data.source;
    tip.appendChild(title);
    tip.appendChild(source);
    addRow(tip, 'Before p50', data.before + ' ms');
    addRow(tip, 'After p50', data.after + ' ms');
    addRow(tip, 'Before p95', data.beforeP95 + ' ms');
    addRow(tip, 'After p95', data.afterP95 + ' ms');
    addRow(tip, 'Speedup', data.speed + 'x');
    addRow(tip, 'Plan', data.plan);
    tip.hidden = false;
    var box = tip.getBoundingClientRect();
    var left = x + 16;
    var top = y + 16;
    if (left + box.width > window.innerWidth - 8) left = x - box.width - 16;
    if (top + box.height > window.innerHeight - 8) top = y - box.height - 16;
    tip.style.left = Math.max(8, left) + 'px';
    tip.style.top = Math.max(8, top) + 'px';
  }
  function hide() { tip.hidden = true; }
  document.querySelectorAll('.row').forEach(function (row) {
    row.addEventListener('mousemove', function (event) {
      show(row, event.clientX, event.clientY);
    });
    row.addEventListener('mouseleave', hide);
    row.addEventListener('focus', function () {
      var rect = row.getBoundingClientRect();
      show(row, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    row.addEventListener('blur', hide);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') hide();
  });
})();
"""


def build_table(results: list[dict]) -> str:
    rows = []
    for query in results:
        kind = verdict(query)
        rows.append(
            "<tr>"
            f"<td>{esc(EN_LABELS.get(query['id'], query['label']))}</td>"
            f"<td class=\"mono\">{esc(query['source'])}</td>"
            f"<td class=\"num\">{fmt_ms(query['baseline']['p50_ms'])}</td>"
            f"<td class=\"num\">{fmt_ms(query['indexed']['p50_ms'])}</td>"
            f"<td class=\"num {kind}\">{fmt_speed(query['speedup_p50'])}x</td>"
            f"<td class=\"num\">{fmt_ms(query['baseline']['p95_ms'])}</td>"
            f"<td class=\"num\">{fmt_ms(query['indexed']['p95_ms'])}</td>"
            f"<td>{esc(plan_summary(query))}</td>"
            "</tr>"
        )
    return "".join(rows)


def build_plans(results: list[dict]) -> str:
    blocks = []
    for query in results:
        if not plan_changed(query):
            continue
        label = EN_LABELS.get(query["id"], query["label"])
        blocks.append(
            '<div class="plan-block">'
            f"<h4>{esc(label)} - {esc(query['source'])}</h4>"
            f"<pre>Before: {esc(query['plan_baseline'])}</pre>"
            f"<pre>After: {esc(query['plan_indexed'])}</pre>"
            "</div>"
        )
    return "".join(blocks)


def main() -> None:
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    results = order_queries(payload["results"])
    wins = [query for query in results if verdict(query) == "win"]
    regressions = [query for query in results if verdict(query) == "regress"]
    unchanged = [query for query in results if not plan_changed(query)]
    median_speed = statistics.median(query["speedup_p50"] for query in wins)
    max_query = max(wins, key=lambda query: query["speedup_p50"])
    regress_query = regressions[0]
    scale = payload["scale"]
    size = payload["db_size"]
    write = payload["write"]
    generated = payload["generated_at"]
    by_id = {query["id"]: query for query in results}

    svg = build_svg(results)
    table_rows = build_table(results)
    plan_blocks = build_plans(results)
    max_id = max_query["id"]

    index_rows = [
        ("idx_mit_student_dt", "Mitigation_Requests",
         "Submitted_Student_ID, Submit_DT DESC", "My mitigation requests", "my_mitigation"),
        ("idx_enrollment_course", "Course_Enrollments",
         "Course_Code, Student_ID", "Teaching roster", "teaching_roster"),
        ("idx_ticket_holder_window", "Time_Tickets",
         "Holder_Student_ID, From_DT, To_DT", "Active time ticket", "ticket_active"),
        ("idx_teach_course", "Teach",
         "Course_Code, Staff_ID", "Teachers by course", "course_teachers"),
        ("idx_pme_programme", "Programme_Major_Enrollments",
         "Programme_Code, Student_ID, Status", "Students by programme (major branch)",
         "programme_students"),
        ("idx_pmin_programme", "Programme_Minor_Enrollments",
         "Programme_Code, Student_ID, Status", "Students by programme (minor branch)",
         "programme_students"),
    ]
    index_html = "".join(
        "<tr>"
        f'<td class="mono">{esc(name)}</td>'
        f'<td class="mono">{esc(table)}</td>'
        f'<td class="mono">{esc(columns)}</td>'
        f"<td>{esc(label)}</td>"
        f'<td class="num win">{fmt_speed(by_id[query_id]["speedup_p50"])}x</td>'
        "</tr>"
        for name, table, columns, label, query_id in index_rows
    )
    index_md = [
        f"| `{name}` | `{table}` | `{columns}` | {label} | "
        f"{fmt_speed(by_id[query_id]['speedup_p50'])}x |"
        for name, table, columns, label, query_id in index_rows
    ]

    html_out = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Database Index Optimization Report</title>
<style>{CSS}</style>
</head>
<body>
<div class="page">
  <header class="masthead">
    <div>
      <p class="eyebrow">Academic Management Portal · SQLite {esc(payload['engine'])}</p>
      <h1>Database Index Optimization Report</h1>
      <p class="lede">Thirteen service queries measured on a synthetic dataset of
      {scale['students']:,} students and {scale['enrollments']:,} enrollments,
      before and after adding secondary indexes.</p>
    </div>
    <button id="theme-toggle" type="button">Dark</button>
  </header>

  <section class="kpis" aria-label="Key metrics">
    <div class="tile">
      <p class="tile-label">Median speedup</p>
      <p class="tile-value">{median_speed:.1f}x</p>
      <p class="tile-note">{len(wins)} queries above 1.5x</p>
    </div>
    <div class="tile">
      <p class="tile-label">Top speedup</p>
      <p class="tile-value">{fmt_speed(max_query['speedup_p50'])}x</p>
      <p class="tile-note">{esc(EN_LABELS[max_id])} p50</p>
    </div>
    <div class="tile">
      <p class="tile-label">Only material regression</p>
      <p class="tile-value">{fmt_speed(regress_query['speedup_p50'])}x</p>
      <p class="tile-note">{esc(EN_LABELS[regress_query['id']])}
      {fmt_ms(regress_query['baseline']['p50_ms'])} to
      {fmt_ms(regress_query['indexed']['p50_ms'])} ms</p>
    </div>
    <div class="tile">
      <p class="tile-label">Size and write cost</p>
      <p class="tile-value">+{size['delta_pct']:.1f}%</p>
      <p class="tile-note">Write maintenance +{write['overhead_pct']:.1f}%</p>
    </div>
  </section>

  <section class="card">
    <div class="card-head">
      <div>
        <h2>Median query latency before and after</h2>
        <p class="sub">Log scale, milliseconds. Each row connects the p50 of one query
        before and after indexing. A short line means the index changed little.</p>
      </div>
      <div class="legend" aria-label="Legend">
        <span><i class="swatch before"></i>Before</span>
        <span><i class="swatch after"></i>After</span>
      </div>
    </div>
    <div class="chart-scroll">{svg}</div>
    <p class="caption">Hover a row, or focus it with the keyboard, to see p95 and the
    query plan. The right column is the p50 speedup. All values appear in the table below.</p>
  </section>

  <div class="grid2">
    <section class="card">
      <h2>Summary</h2>
      <ul>
        <li>Six secondary indexes cover five hot access paths. {len(wins)} queries move
        from full scans to index lookups, with a median p50 speedup of {median_speed:.1f}x
        and a maximum of {fmt_speed(max_query['speedup_p50'])}x.</li>
        <li>The largest wins are the per-student mitigation history
        ({fmt_speed(by_id['my_mitigation']['speedup_p50'])}x) and the teaching roster
        ({fmt_speed(by_id['teaching_roster']['speedup_p50'])}x). The first previously
        scanned 10,000 requests and sorted them; the second scanned 40,000 enrollments.</li>
        <li>{len(unchanged)} queries keep their old plans and vary within ±14%. The course
        catalog's teacher subquery switches to a covering index but the overall query is flat.</li>
        <li>The staff-wide mitigation list is the only material regression: p50
        {fmt_ms(regress_query['baseline']['p50_ms'])} to
        {fmt_ms(regress_query['indexed']['p50_ms'])} ms. The plan scans the new index and
        adds row lookups while the sort remains. The index stays because the per-student
        view is far more frequent and much faster.</li>
      </ul>
    </section>

    <section class="card">
      <h2>Costs and trade-offs</h2>
      <ul>
        <li><strong>Writes:</strong> enrollment inserts cost {write['baseline']['p50_ms']} to
        {write['indexed']['p50_ms']} ms per {write['baseline']['inserts_per_round']} rows
        (+{write['overhead_pct']:.1f}%, about +4 µs per row). This is the second B-tree
        maintenance cost. The test disables fsync; commit durability dominates in production.</li>
        <li><strong>Size:</strong> the database grows from
        {size['baseline_bytes'] / 1024 / 1024:.1f} MB to
        {size['indexed_bytes'] / 1024 / 1024:.1f} MB (+{size['delta_pct']:.1f}%),
        scaling linearly with data.</li>
        <li><strong>Staff list:</strong> p95 rises from
        {fmt_ms(regress_query['baseline']['p95_ms'])} to
        {fmt_ms(regress_query['indexed']['p95_ms'])} ms. Pagination or keyset pagination
        is the follow-up once the table grows further.</li>
        <li><strong>Open issue:</strong> time-ticket windows store local input time but are
        checked against UTC <code>CURRENT_TIMESTAMP</code>, an eight-hour offset in Hong Kong.
        Indexes change the access path, not this semantic issue.</li>
      </ul>
    </section>
  </div>

  <section class="card">
    <h2>Indexes</h2>
    <p class="sub">Idempotent DDL in <code>database/indexes.sql</code>. Each gain comes from
    the benchmark query that uses the index.</p>
    <div class="table-scroll">
    <table>
      <thead><tr><th>Index</th><th>Table</th><th>Columns</th><th>Query</th>
        <th class="num">p50 speedup</th></tr></thead>
      <tbody>{index_html}</tbody>
    </table>
    </div>
    <p class="caption">The major and minor programme indexes support one UNION query;
    2.03x is the gain for the whole query.</p>
  </section>

  <section class="card">
    <h2>Query results</h2>
    <p class="sub">Sorted by p50 speedup, from the largest gain to the one regression.
    The plan column is a summary; full plans are in the appendix.</p>
    <div class="table-scroll">
    <table>
      <thead><tr><th>Query</th><th>Service</th><th class="num">Before p50</th>
        <th class="num">After p50</th><th class="num">Speedup</th>
        <th class="num">Before p95</th><th class="num">After p95</th><th>Plan</th></tr></thead>
      <tbody>{table_rows}</tbody>
    </table>
    </div>
    <details>
      <summary>Full query plans (7 queries whose plans changed)</summary>
      <div class="plans">{plan_blocks}</div>
    </details>
  </section>

  <section class="card">
    <h2>Method</h2>
    <ul>
      <li>Scale: {scale['students']:,} students, {scale['staff']:,} staff,
      {scale['courses']:,} courses, {scale['enrollments']:,} enrollments,
      {scale['mitigation_requests']:,} mitigation requests,
      {scale['time_tickets']:,} time tickets, 6,000 overload requests. Fixed random seed.</li>
      <li>Both databases come from the same <code>create.sql</code>. The baseline drops every
      <code>idx_%</code> index; the indexed copy runs <code>database/indexes.sql</code>.
      The rows are identical.</li>
      <li>The 13 queries are copied from the NestJS services. Both sides use a 128 MB page
      cache and are warmed before timing. Five interleaved passes produce p50, p95, and p99.
      Only database latency is measured, not HTTP, auth, or serialization.</li>
      <li>The write test interleaves both databases and disables fsync to isolate index
      maintenance. The database files live in a local temp directory to avoid cloud-sync
      I/O stalls.</li>
      <li>Environment: macOS, SQLite {esc(payload['engine'])}, Python standard library
      <code>sqlite3</code>.</li>
    </ul>
  </section>

  <section class="card">
    <h2>Reproduce</h2>
    <pre>python3 scripts/benchmark.py        # rebuild both databases and write JSON / CSV
python3 scripts/make_report.py      # regenerate the Chinese report
python3 scripts/make_report_en.py   # regenerate this English report
sqlite3 pjDB.db &lt; database/indexes.sql   # migrate an existing database</pre>
    <p class="caption">Results:
    <a href="benchmark-results.json">benchmark-results.json</a> ·
    <a href="benchmark-results.csv">benchmark-results.csv</a> ·
    Index DDL: <a href="../database/indexes.sql">database/indexes.sql</a></p>
    <p class="caption">The demo database <code>pjDB.db</code> already has the six indexes;
    <code>EXPLAIN QUERY PLAN</code> confirms index use for the time-ticket and enrollment lookups.</p>
  </section>

  <footer>
    Benchmark run at {esc(generated)}. Report generated by
    <code>scripts/make_report_en.py</code>. Synthetic data; absolute timings are not
    production latency. On MySQL or PostgreSQL, keep the same leading columns and verify
    the plan with EXPLAIN.
  </footer>
</div>
<div id="tip" role="tooltip" hidden></div>
<script>{EN_JS}</script>
</body>
</html>
"""
    html_path = REPORT_DIR / "optimization-report-en.html"
    html_path.write_text(html_out, encoding="utf-8")

    md_lines = [
        "# Academic Management Portal: Database Index Optimization Report",
        "",
        f"Generated: {generated}  ",
        f"Engine: SQLite {payload['engine']}  ",
        f"Dataset: {scale['students']:,} students / {scale['courses']:,} courses / "
        f"{scale['enrollments']:,} enrollments / {scale['mitigation_requests']:,} "
        f"mitigation requests / {scale['time_tickets']:,} time tickets",
        "",
        "## Summary",
        "",
        f"- Six secondary indexes, {len(wins)} queries moved from full scans to index "
        f"lookups, median p50 speedup {median_speed:.1f}x, maximum "
        f"{fmt_speed(max_query['speedup_p50'])}x "
        f"({EN_LABELS[max_query['id']]}).",
        f"- The staff-wide mitigation list is the only material regression: p50 "
        f"{fmt_ms(regress_query['baseline']['p50_ms'])} to "
        f"{fmt_ms(regress_query['indexed']['p50_ms'])} ms, p95 "
        f"{fmt_ms(regress_query['baseline']['p95_ms'])} to "
        f"{fmt_ms(regress_query['indexed']['p95_ms'])} ms. The plan scans the new index "
        f"and adds row lookups while the sort remains.",
        f"- Database size +{size['delta_pct']:.1f}%; enrollment index maintenance "
        f"+{write['overhead_pct']:.1f}% with fsync disabled (about +4 µs per row).",
        f"- {len(unchanged)} queries keep identical plans and vary within ±14%, treated as noise.",
        "",
        "## Query results",
        "",
        "| Query | Service | Before p50 | After p50 | Speedup | Before p95 | After p95 | Plan |",
        "|---|---|---:|---:|---:|---:|---:|---|",
    ]
    for query in results:
        kind = verdict(query)
        mark = {"win": "**", "neutral": "", "regress": "**"}[kind]
        speed = f"{fmt_speed(query['speedup_p50'])}x"
        md_lines.append(
            f"| {EN_LABELS.get(query['id'], query['label'])} | `{query['source']}` | "
            f"{fmt_ms(query['baseline']['p50_ms'])} | {fmt_ms(query['indexed']['p50_ms'])} | "
            f"{mark}{speed}{mark} | {fmt_ms(query['baseline']['p95_ms'])} | "
            f"{fmt_ms(query['indexed']['p95_ms'])} | {plan_summary(query)} |"
        )
    md_lines += [
        "",
        "*Milliseconds. Bold marks a speedup above 1.5x or a material regression. "
        "Students without major measures 0.93x with an unchanged plan; the 0.1 ms "
        "difference is treated as noise.*",
        "",
        "## Indexes",
        "",
        "| Index | Table | Columns | Query | p50 speedup |",
        "|---|---|---|---|---:|",
        *index_md,
        "",
        "DDL: `database/indexes.sql`; `create.sql` section 20 stays in sync.",
        "",
        "## Method and reproduction",
        "",
        "- Both databases come from one `create.sql`; the baseline drops every `idx_%` index, "
        "the indexed copy runs the migration, and the rows are identical.",
        "- The 13 queries are copied from service SQL. A 128 MB page cache, two-sided warmup, "
        "and five interleaved passes produce p50, p95, and p99.",
        "- The write test interleaves both databases with fsync disabled to isolate index "
        "maintenance. Database files live in a local temp directory.",
        "- Only database latency is measured, not HTTP or serialization.",
        "",
        "```bash",
        "python3 scripts/benchmark.py",
        "python3 scripts/make_report.py",
        "python3 scripts/make_report_en.py",
        "sqlite3 pjDB.db < database/indexes.sql",
        "```",
        "",
        "The demo database `pjDB.db` already has the six indexes. "
        "Full charts and plans: `reports/optimization-report-en.html`.",
    ]
    md_path = REPORT_DIR / "optimization-report-en.md"
    md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    print(f"Wrote {html_path}")
    print(f"Wrote {md_path}")


if __name__ == "__main__":
    main()
