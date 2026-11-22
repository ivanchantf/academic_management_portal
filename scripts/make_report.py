#!/usr/bin/env python3
"""Render the index benchmark as a self-contained HTML report and a Markdown summary.

Reads reports/benchmark-results.json, writes:
  reports/optimization-report.html
  reports/optimization-report.md

No dependencies beyond the Python standard library.
"""

from __future__ import annotations

import html
import json
import math
import re
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REPORT_DIR = ROOT / "reports"
DATA = REPORT_DIR / "benchmark-results.json"
INDEXES_SQL = ROOT / "database" / "indexes.sql"

CN_LABELS = {
    "my_mitigation": "学生缓考记录",
    "teaching_roster": "教师授课名单",
    "ticket_active": "有效注册时间票",
    "course_teachers": "课程任课教师",
    "programme_students": "专业学生名单",
    "transcript": "学生成绩单",
    "staff_list": "教职工列表",
    "syllabus": "培养方案课程",
    "course_catalog": "课程目录",
    "my_overload": "我的超修申请",
    "login": "登录查询",
    "not_enrolled_major": "无专业学生",
    "all_mitigation": "全部缓考申请",
}

VERDICT_CN = {"win": "提速", "neutral": "持平", "regress": "回退"}


def fmt_ms(value: float) -> str:
    if value < 0.1:
        return f"{value:.3f}"
    if value < 10:
        return f"{value:.2f}"
    return f"{value:.1f}"


def fmt_speed(value: float) -> str:
    text = f"{value:.2f}"
    if text.endswith("0"):
        text = text[:-1]
    return text


def verdict(query: dict) -> str:
    speed = query["speedup_p50"]
    if speed >= 1.5:
        return "win"
    # A small relative loss on a slow query still matters; on a microsecond
    # query it is noise.
    if speed < 0.9 or (speed < 1.0 and query["baseline"]["p50_ms"] >= 5):
        return "regress"
    return "neutral"


def plan_changed(query: dict) -> bool:
    return query["plan_baseline"] != query["plan_indexed"]


def plan_summary(query: dict) -> str:
    if not plan_changed(query):
        return "未变"
    indexed = query["plan_indexed"]
    names = list(dict.fromkeys(re.findall(r"USING (?:COVERING )?INDEX (\w+)", indexed)))
    new_names = [name for name in names if name.startswith("idx_")]
    if re.search(r"SCAN \w+ USING (?:COVERING )?INDEX", indexed) and new_names:
        return f"索引全扫描（{new_names[0]}）"
    if "SEARCH" in indexed and new_names:
        return f"索引查找（{' / '.join(new_names)}）"
    if names:
        return f"索引查找（{names[0]}）"
    return "计划改变"


def order_queries(results: list[dict]) -> list[dict]:
    rank = {"win": 0, "neutral": 1, "regress": 2}
    return sorted(
        results,
        key=lambda query: (rank[verdict(query)], -query["speedup_p50"]),
    )


def esc(value) -> str:
    return html.escape(str(value), quote=True)


def build_svg(results: list[dict]) -> str:
    width, height = 1100, 518
    left, right = 205, 150
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
        f'aria-label="优化前后中位查询耗时，对数轴">'
    ]

    ticks = [0.01, 0.1, 1, 10]
    for tick in ticks:
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
        f"中位耗时（毫秒，对数轴）</text>"
    )

    for row_index, query in enumerate(results):
        y = top + row_index * row_height + row_height / 2
        before = query["baseline"]["p50_ms"]
        after = query["indexed"]["p50_ms"]
        x_before, x_after = x_scale(before), x_scale(after)
        kind = verdict(query)
        label = CN_LABELS.get(query["id"], query["label"])
        speed = fmt_speed(query["speedup_p50"])
        tooltip = (
            f"{label}｜{query['source']}｜优化前 p50 {fmt_ms(before)} ms，"
            f"p95 {fmt_ms(query['baseline']['p95_ms'])} ms｜优化后 p50 "
            f"{fmt_ms(after)} ms，p95 {fmt_ms(query['indexed']['p95_ms'])} ms｜"
            f"{speed}×｜{plan_summary(query)}"
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
        parts.append(
            f'<circle class="dot before" cx="{x_before:.1f}" cy="{y:.1f}" r="5.5"/>'
        )
        parts.append(
            f'<circle class="dot after" cx="{x_after:.1f}" cy="{y:.1f}" r="6.5"/>'
        )
        parts.append(
            f'<text class="row-label" x="{left - 14}" y="{y + 4.5:.1f}" '
            f'text-anchor="end">{esc(label)}</text>'
        )
        parts.append(
            f'<text class="speed {kind}" x="{width - 24}" y="{y + 4.5:.1f}" '
            f'text-anchor="end">{speed}×</text>'
        )
        # Direct-label the two largest wins only; the rest stay in the tooltip
        # and the table view.
        if query["id"] in {"my_mitigation", "teaching_roster"}:
            parts.append(
                f'<text class="dlabel" x="{x_after + 11:.1f}" y="{y - 8:.1f}">'
                f"{fmt_ms(after)} ms</text>"
            )
        parts.append("</g>")

    parts.append("</svg>")
    return "".join(parts)


CSS = """
:root {
  color-scheme: light;
  --page: #f9f9f7;
  --surface: #fcfcfb;
  --ink: #0b0b0b;
  --ink-2: #52514e;
  --muted: #898781;
  --grid: #e1e0d9;
  --axis: #c3c2b7;
  --before: #86b6ef;
  --after: #1c5cab;
  --good: #006300;
  --bad: #d03b3b;
  --border: rgba(11, 11, 11, 0.10);
  --hover: rgba(11, 11, 11, 0.035);
  --code-bg: #f2f1ed;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --page: #0d0d0d;
    --surface: #1a1a19;
    --ink: #f0efec;
    --ink-2: #c3c2b7;
    --muted: #898781;
    --grid: #2c2c2a;
    --axis: #383835;
    --before: #184f95;
    --after: #86b6ef;
    --good: #0ca30c;
    --bad: #d03b3b;
    --border: rgba(255, 255, 255, 0.10);
    --hover: rgba(255, 255, 255, 0.05);
    --code-bg: #232321;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --page: #0d0d0d;
  --surface: #1a1a19;
  --ink: #f0efec;
  --ink-2: #c3c2b7;
  --muted: #898781;
  --grid: #2c2c2a;
  --axis: #383835;
  --before: #184f95;
  --after: #86b6ef;
  --good: #0ca30c;
  --bad: #d03b3b;
  --border: rgba(255, 255, 255, 0.10);
  --hover: rgba(255, 255, 255, 0.05);
  --code-bg: #232321;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--page);
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  font-size: 15px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
.page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 40px 32px 64px;
}
.masthead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}
.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1 {
  margin: 0 0 10px;
  font-size: 32px;
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.lede {
  margin: 0;
  max-width: 760px;
  color: var(--ink-2);
  font-size: 14.5px;
}
h2 {
  margin: 0 0 6px;
  font-size: 19px;
  line-height: 1.35;
}
h3 {
  margin: 18px 0 6px;
  font-size: 14.5px;
}
p { margin: 8px 0; }
ul { margin: 8px 0; padding-left: 20px; }
li { margin: 5px 0; }
.sub {
  margin: 0 0 18px;
  color: var(--ink-2);
  font-size: 13.5px;
}
#theme-toggle {
  flex: none;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink-2);
  border-radius: 999px;
  padding: 7px 15px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
#theme-toggle:hover { color: var(--ink); }
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}
.tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px 14px;
}
.tile-label {
  margin: 0 0 4px;
  color: var(--muted);
  font-size: 12px;
}
.tile-value {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.tile-note {
  margin: 5px 0 0;
  color: var(--ink-2);
  font-size: 12px;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 18px;
}
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 8px;
}
.legend {
  display: flex;
  gap: 16px;
  padding-top: 6px;
  color: var(--ink-2);
  font-size: 12.5px;
  white-space: nowrap;
}
.legend span { display: inline-flex; align-items: center; gap: 7px; }
.swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.swatch.before { background: var(--before); }
.swatch.after { background: var(--after); }
.chart-scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}
.table-scroll { overflow-x: auto; }
.chart {
  display: block;
  width: 100%;
  min-width: 820px;
  height: auto;
}
.row .hit { fill: transparent; }
.row:hover .hit, .row:focus-visible .hit { fill: var(--hover); }
.row:focus { outline: none; }
.row:focus-visible .hit { stroke: var(--after); stroke-width: 2; }
.connector { stroke: var(--before); stroke-width: 2; }
.dot.before { fill: var(--before); stroke: var(--surface); stroke-width: 2; }
.dot.after { fill: var(--after); stroke: var(--surface); stroke-width: 2; }
.row-label { fill: var(--ink-2); font-size: 13px; }
.speed { font-size: 13px; font-variant-numeric: tabular-nums; }
.speed.win { fill: var(--good); }
.speed.neutral { fill: var(--muted); }
.speed.regress { fill: var(--bad); }
.grid { stroke: var(--grid); stroke-width: 1; }
.axis { stroke: var(--axis); stroke-width: 1; }
.tick, .axis-title { fill: var(--muted); font-size: 11.5px; font-variant-numeric: tabular-nums; }
.dlabel { fill: var(--ink-2); font-size: 11.5px; font-variant-numeric: tabular-nums; }
.caption {
  margin: 14px 0 0;
  color: var(--ink-2);
  font-size: 12.5px;
}
.grid2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.grid2 .card { margin-bottom: 18px; }
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-top: 12px;
}
th, td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--grid);
  vertical-align: top;
}
th {
  color: var(--muted);
  font-weight: 500;
  font-size: 12px;
  white-space: nowrap;
}
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
td.win { color: var(--good); }
td.regress { color: var(--bad); }
td.neutral { color: var(--muted); }
.mono, code, pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}
code {
  background: var(--code-bg);
  padding: 1px 5px;
  border-radius: 4px;
}
pre {
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  overflow-x: auto;
  line-height: 1.55;
}
details { margin-top: 12px; }
summary {
  cursor: pointer;
  color: var(--ink-2);
  font-size: 13.5px;
}
summary:hover { color: var(--ink); }
.plans { display: grid; gap: 14px; margin-top: 12px; }
.plan-block h4 { margin: 0 0 6px; font-size: 13px; }
.plan-block pre { margin: 0 0 6px; white-space: pre-wrap; word-break: break-word; }
footer {
  color: var(--muted);
  font-size: 12px;
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px solid var(--grid);
}
footer a { color: var(--ink-2); }
#tip {
  position: fixed;
  z-index: 50;
  max-width: 340px;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
  padding: 10px 12px;
  font-size: 12.5px;
  line-height: 1.55;
  pointer-events: none;
}
.tip-title { font-weight: 600; margin-bottom: 2px; }
.tip-src { color: var(--muted); font-size: 11.5px; margin-bottom: 6px; }
.tip-row { display: flex; justify-content: space-between; gap: 18px; }
.tip-row span:first-child { color: var(--ink-2); }
.tip-row span:last-child { font-variant-numeric: tabular-nums; }
@media (max-width: 900px) {
  .page { padding: 28px 18px 56px; }
  .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid2 { grid-template-columns: minmax(0, 1fr); }
  h1 { font-size: 26px; }
  .masthead { flex-direction: column; }
}
@media (max-width: 520px) {
  .kpis { grid-template-columns: minmax(0, 1fr); }
  .card { padding: 18px 16px; }
  .card-head { flex-direction: column; gap: 8px; }
}
@media print {
  #theme-toggle, #tip { display: none; }
  .card { break-inside: avoid; }
}
"""

JS = """
(function () {
  var root = document.documentElement;
  var button = document.getElementById('theme-toggle');
  function current() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function paint(mode) {
    root.dataset.theme = mode;
    button.textContent = mode === 'dark' ? '浅色' : '深色';
  }
  try {
    var saved = localStorage.getItem('amp-theme');
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  } catch (error) {}
  button.textContent = current() === 'dark' ? '浅色' : '深色';
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
    addRow(tip, '优化前 p50', data.before + ' ms');
    addRow(tip, '优化后 p50', data.after + ' ms');
    addRow(tip, '优化前 p95', data.beforeP95 + ' ms');
    addRow(tip, '优化后 p95', data.afterP95 + ' ms');
    addRow(tip, '提速', data.speed + '×');
    addRow(tip, '查询计划', data.plan);
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
            f"<td>{esc(CN_LABELS.get(query['id'], query['label']))}</td>"
            f"<td class=\"mono\">{esc(query['source'])}</td>"
            f"<td class=\"num\">{fmt_ms(query['baseline']['p50_ms'])}</td>"
            f"<td class=\"num\">{fmt_ms(query['indexed']['p50_ms'])}</td>"
            f"<td class=\"num {kind}\">{fmt_speed(query['speedup_p50'])}×</td>"
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
        label = CN_LABELS.get(query["id"], query["label"])
        blocks.append(
            '<div class="plan-block">'
            f"<h4>{esc(label)} · {esc(query['source'])}</h4>"
            f"<pre>优化前：{esc(query['plan_baseline'])}</pre>"
            f"<pre>优化后：{esc(query['plan_indexed'])}</pre>"
            "</div>"
        )
    return "".join(blocks)


def build_index_rows(by_id: dict[str, dict]) -> str:
    rows = [
        ("idx_mit_student_dt", "Mitigation_Requests",
         "Submitted_Student_ID, Submit_DT DESC", "学生缓考记录", "my_mitigation"),
        ("idx_enrollment_course", "Course_Enrollments",
         "Course_Code, Student_ID", "教师授课名单", "teaching_roster"),
        ("idx_ticket_holder_window", "Time_Tickets",
         "Holder_Student_ID, From_DT, To_DT", "有效注册时间票", "ticket_active"),
        ("idx_teach_course", "Teach",
         "Course_Code, Staff_ID", "课程任课教师", "course_teachers"),
        ("idx_pme_programme", "Programme_Major_Enrollments",
         "Programme_Code, Student_ID, Status", "专业学生名单（主修分支）", "programme_students"),
        ("idx_pmin_programme", "Programme_Minor_Enrollments",
         "Programme_Code, Student_ID, Status", "专业学生名单（辅修分支）", "programme_students"),
    ]
    parts = []
    for index_name, table, columns, label, query_id in rows:
        speed = fmt_speed(by_id[query_id]["speedup_p50"])
        parts.append(
            "<tr>"
            f'<td class="mono">{esc(index_name)}</td>'
            f'<td class="mono">{esc(table)}</td>'
            f'<td class="mono">{esc(columns)}</td>'
            f"<td>{esc(label)}</td>"
            f'<td class="num win">{speed}×</td>'
            "</tr>"
        )
    return "".join(parts)


def build_index_md(by_id: dict[str, dict]) -> list[str]:
    rows = [
        ("idx_mit_student_dt", "Mitigation_Requests",
         "Submitted_Student_ID, Submit_DT DESC", "学生缓考记录", "my_mitigation"),
        ("idx_enrollment_course", "Course_Enrollments",
         "Course_Code, Student_ID", "教师授课名单", "teaching_roster"),
        ("idx_ticket_holder_window", "Time_Tickets",
         "Holder_Student_ID, From_DT, To_DT", "有效注册时间票", "ticket_active"),
        ("idx_teach_course", "Teach",
         "Course_Code, Staff_ID", "课程任课教师", "course_teachers"),
        ("idx_pme_programme", "Programme_Major_Enrollments",
         "Programme_Code, Student_ID, Status", "专业学生名单（主修）", "programme_students"),
        ("idx_pmin_programme", "Programme_Minor_Enrollments",
         "Programme_Code, Student_ID, Status", "专业学生名单（辅修）", "programme_students"),
    ]
    lines = []
    for index_name, table, columns, label, query_id in rows:
        speed = fmt_speed(by_id[query_id]["speedup_p50"])
        lines.append(
            f"| `{index_name}` | `{table}` | `{columns}` | {label} | {speed}× |"
        )
    return lines


def main() -> None:
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    results = order_queries(payload["results"])
    wins = [query for query in results if verdict(query) == "win"]
    regressions = [query for query in results if verdict(query) == "regress"]
    unchanged = [query for query in results if not plan_changed(query)]
    median_speed = statistics.median(query["speedup_p50"] for query in wins)
    max_query = max(wins, key=lambda query: query["speedup_p50"])
    regress_query = regressions[0] if regressions else None
    scale = payload["scale"]
    size = payload["db_size"]
    write = payload["write"]
    generated = payload["generated_at"]
    generated_day = generated[:10]

    svg = build_svg(results)
    table_rows = build_table(results)
    plan_blocks = build_plans(results)
    by_id = {query["id"]: query for query in results}
    index_rows = build_index_rows(by_id)
    index_md = build_index_md(by_id)

    regress_tile_value = f"{fmt_speed(regress_query['speedup_p50'])}×" if regress_query else "无"
    regress_tile_note = (
        f"{CN_LABELS[regress_query['id']]} {fmt_ms(regress_query['baseline']['p50_ms'])} → "
        f"{fmt_ms(regress_query['indexed']['p50_ms'])} ms"
        if regress_query
        else "所有查询持平或提速"
    )

    html_out = f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>数据库索引优化报告</title>
<style>{CSS}</style>
</head>
<body>
<div class="page">
  <header class="masthead">
    <div>
      <p class="eyebrow">Academic Management Portal · SQLite {esc(payload['engine'])}</p>
      <h1>数据库索引优化报告</h1>
      <p class="lede">在 {scale['students']:,} 名学生、{scale['enrollments']:,} 条选课记录的合成数据上，
      对比 13 条真实服务查询在加索引前后的执行计划与数据库层耗时。</p>
    </div>
    <button id="theme-toggle" type="button">深色</button>
  </header>

  <section class="kpis" aria-label="关键指标">
    <div class="tile">
      <p class="tile-label">受益查询中位提速</p>
      <p class="tile-value">{median_speed:.1f}×</p>
      <p class="tile-note">{len(wins)} 条查询进入 1.5× 以上</p>
    </div>
    <div class="tile">
      <p class="tile-label">最高提速</p>
      <p class="tile-value">{fmt_speed(max_query['speedup_p50'])}×</p>
      <p class="tile-note">{esc(CN_LABELS[max_query['id']])} p50</p>
    </div>
    <div class="tile">
      <p class="tile-label">唯一实质回退</p>
      <p class="tile-value">{regress_tile_value}</p>
      <p class="tile-note">{regress_tile_note}</p>
    </div>
    <div class="tile">
      <p class="tile-label">体积与写入代价</p>
      <p class="tile-value">+{size['delta_pct']:.1f}%</p>
      <p class="tile-note">写入维护 +{write['overhead_pct']:.1f}%</p>
    </div>
  </section>

  <section class="card">
    <div class="card-head">
      <div>
        <h2>优化前后中位查询耗时</h2>
        <p class="sub">对数轴，毫秒。每行连接同一条查询的优化前与优化后 p50，线越短说明索引影响越小。</p>
      </div>
      <div class="legend" aria-label="图例">
        <span><i class="swatch before"></i>优化前</span>
        <span><i class="swatch after"></i>优化后</span>
      </div>
    </div>
    <div class="chart-scroll">{svg}</div>
    <p class="caption">悬停或用键盘聚焦某一行可查看 p95 与执行计划。右侧数值为 p50 提速倍数。
    全部数值见下方表格视图。</p>
  </section>

  <div class="grid2">
    <section class="card">
      <h2>结论</h2>
      <ul>
        <li>6 条二级索引覆盖 5 类高频访问路径。{len(wins)} 条查询的计划从全表扫描改为索引查找，
        p50 提速 2.03× 到 {fmt_speed(max_query['speedup_p50'])}×，中位 {median_speed:.1f}×。</li>
        <li>收益最大的是学生缓考记录（{fmt_speed(results[0]['speedup_p50'])}×）与教师授课名单
        （{fmt_speed(results[1]['speedup_p50'])}×）。前者原来每次扫 1 万条申请并排序，后者扫 4 万条选课记录。</li>
        <li>{len(unchanged)} 条查询的执行计划没有变化，耗时在 ±14% 内波动，属于测量噪声。课程目录的教师子查询改用覆盖索引，
        整体耗时持平。</li>
        <li>唯一实质回退是管理端“全部缓考申请”，p50 从 {fmt_ms(regress_query['baseline']['p50_ms'])} ms
        升到 {fmt_ms(regress_query['indexed']['p50_ms'])} ms。索引让计划改成扫描索引再回表，排序仍然存在。
        保留该索引，因为学生端查询更频繁，收益也更大。</li>
      </ul>
    </section>

    <section class="card">
      <h2>代价与取舍</h2>
      <ul>
        <li><strong>写入：</strong>选课插入每 {write['baseline']['inserts_per_round']} 条从
        {write['baseline']['p50_ms']} ms 升到 {write['indexed']['p50_ms']} ms
        （+{write['overhead_pct']:.1f}%，约 +4 µs/行）。这是维护第二条 B 树的成本。测试关闭了 fsync，
        生产环境的提交开销会盖住这部分差异。</li>
        <li><strong>体积：</strong>数据库从 {size['baseline_bytes'] / 1024 / 1024:.1f} MB 增到
        {size['indexed_bytes'] / 1024 / 1024:.1f} MB（+{size['delta_pct']:.1f}%），随数据量线性增长。</li>
        <li><strong>管理端列表：</strong>p95 从 {fmt_ms(regress_query['baseline']['p95_ms'])} ms
        升到 {fmt_ms(regress_query['indexed']['p95_ms'])} ms。数据量继续增长时，这个列表需要分页或键集分页，
        不能每次取全量。</li>
        <li><strong>仍需处理：</strong>时间票的起止时间由前端按本地时间写入，
        注册校验却拿它和 UTC 的 <code>CURRENT_TIMESTAMP</code> 比较，香港时区会有 8 小时偏移。
        索引只改变访问路径，不修复这个语义问题。</li>
      </ul>
    </section>
  </div>

  <section class="card">
    <h2>索引清单</h2>
    <p class="sub">全部为幂等 DDL，见 <code>database/indexes.sql</code>。收益列来自同一条基准查询。</p>
    <div class="table-scroll">
    <table>
      <thead><tr><th>索引</th><th>表</th><th>列</th><th>支撑查询</th><th class="num">p50 提速</th></tr></thead>
      <tbody>
        {index_rows}
      </tbody>
    </table>
    </div>
    <p class="caption">主修与辅修两条索引支撑同一条 UNION 查询，2.03× 是整条查询的收益。</p>
  </section>

  <section class="card">
    <h2>查询明细</h2>
    <p class="sub">按结论分组：提速、持平、回退。计划列只给摘要，完整计划见下一节。
    “无专业学生”的 0.93× 计划未变，绝对差 0.1 ms，按噪声处理。</p>
    <details>
      <summary>表格视图（13 条查询，p50 / p95 单位 ms）</summary>
      <div class="table-scroll">
      <table>
        <thead><tr><th>查询</th><th>服务位置</th><th class="num">前 p50</th><th class="num">后 p50</th>
          <th class="num">提速</th><th class="num">前 p95</th><th class="num">后 p95</th><th>计划</th></tr></thead>
        <tbody>{table_rows}</tbody>
      </table>
      </div>
    </details>
    <details>
      <summary>完整查询计划（7 条计划发生变化的查询）</summary>
      <div class="plans">{plan_blocks}</div>
    </details>
  </section>

  <section class="card">
    <h2>方法</h2>
    <ul>
      <li>数据规模：{scale['students']:,} 名学生、{scale['staff']:,} 名教职工、{scale['courses']:,} 门课程、
      {scale['enrollments']:,} 条选课、{scale['mitigation_requests']:,} 条缓考申请、
      {scale['time_tickets']:,} 张时间票、6,000 条超修申请。固定随机种子生成。</li>
      <li>两个数据库来自同一份 <code>create.sql</code>：基线库删除全部 <code>idx_%</code> 索引，
      优化库执行 <code>database/indexes.sql</code>。数据行完全相同。</li>
      <li>13 条查询逐字取自 NestJS service。两侧使用 128 MB page cache 并预热，5 轮交错采样，
      汇总后取 p50 / p95 / p99。只测数据库层，不含 HTTP、鉴权与序列化。</li>
      <li>写入测试交错执行，关闭 fsync 单独测索引维护成本；数据库文件放在本地临时目录，
      避开云同步盘的 I/O 抖动。</li>
      <li>环境：macOS，SQLite {esc(payload['engine'])}，Python 标准库 <code>sqlite3</code>。</li>
    </ul>
  </section>

  <section class="card">
    <h2>复现</h2>
    <pre>python3 scripts/benchmark.py        # 重建两个库、采样、写 JSON / CSV
python3 scripts/make_report.py      # 重新生成本报告
sqlite3 pjDB.db &lt; database/indexes.sql   # 应用到现有数据库</pre>
    <p class="caption">基准结果：<a href="benchmark-results.json">benchmark-results.json</a> ·
    <a href="benchmark-results.csv">benchmark-results.csv</a> ·
    索引 DDL：<a href="../database/indexes.sql">database/indexes.sql</a></p>
    <p class="caption">演示库 <code>pjDB.db</code> 已应用这 6 条索引，
    <code>EXPLAIN QUERY PLAN</code> 已确认时间票与选课查询走索引。</p>
  </section>

  <footer>
    基准运行于 {esc(generated)}，报告由 <code>scripts/make_report.py</code> 生成。
    合成数据用于对比访问路径，绝对值不代表生产环境延迟。
    生产数据库为 MySQL 或 PostgreSQL 时，保留相同的前导列，并用 EXPLAIN 复核计划。
  </footer>
</div>
<div id="tip" role="tooltip" hidden></div>
<script>{JS}</script>
</body>
</html>
"""
    html_path = REPORT_DIR / "optimization-report.html"
    html_path.write_text(html_out, encoding="utf-8")

    md_lines = [
        "# Academic Management Portal 数据库索引优化报告",
        "",
        f"生成时间：{generated}  ",
        f"数据库：SQLite {payload['engine']}  ",
        f"数据规模：{scale['students']:,} 学生 / {scale['courses']:,} 课程 / "
        f"{scale['enrollments']:,} 选课 / {scale['mitigation_requests']:,} 缓考申请 / "
        f"{scale['time_tickets']:,} 时间票",
        "",
        "## 结论",
        "",
        f"- 6 条二级索引，{len(wins)} 条查询的执行计划从全表扫描改为索引查找，"
        f"p50 中位提速 {median_speed:.1f}×，最高 {fmt_speed(max_query['speedup_p50'])}×"
        f"（{CN_LABELS[max_query['id']]}）。",
        f"- 管理端“全部缓考申请”是唯一实质回退：p50 {fmt_ms(regress_query['baseline']['p50_ms'])} → "
        f"{fmt_ms(regress_query['indexed']['p50_ms'])} ms，"
        f"p95 {fmt_ms(regress_query['baseline']['p95_ms'])} → "
        f"{fmt_ms(regress_query['indexed']['p95_ms'])} ms。索引使计划改为索引扫描加回表，排序仍在。",
        f"- 数据库体积 +{size['delta_pct']:.1f}%，选课写入的索引维护成本 +{write['overhead_pct']:.1f}%"
        f"（关闭 fsync 单独测量，约 +4 µs/行）。",
        f"- {len(unchanged)} 条查询计划未变，耗时在 ±14% 内波动，按噪声处理。",
        "",
        "## 查询结果",
        "",
        "| 查询 | 服务位置 | 前 p50 | 后 p50 | 提速 | 前 p95 | 后 p95 | 计划 |",
        "|---|---|---:|---:|---:|---:|---:|---|",
    ]
    for query in results:
        kind = verdict(query)
        mark = {"win": "**", "neutral": "", "regress": "**"}[kind]
        speed = f"{fmt_speed(query['speedup_p50'])}×"
        md_lines.append(
            f"| {CN_LABELS.get(query['id'], query['label'])} | `{query['source']}` | "
            f"{fmt_ms(query['baseline']['p50_ms'])} | {fmt_ms(query['indexed']['p50_ms'])} | "
            f"{mark}{speed}{mark} | {fmt_ms(query['baseline']['p95_ms'])} | "
            f"{fmt_ms(query['indexed']['p95_ms'])} | {plan_summary(query)} |"
        )
    md_lines += [
        "",
        "*时间单位为毫秒。加粗为提速 1.5× 以上或明确回退。“无专业学生”的 0.93× 计划未变，绝对差 0.1 ms，按噪声处理。*",
        "",
        "## 索引清单",
        "",
        "| 索引 | 表 | 列 | 支撑查询 | p50 提速 |",
        "|---|---|---|---|---:|",
        *index_md,
        "",
        "DDL 见 `database/indexes.sql`，`create.sql` 第 20 节保持同步。",
        "",
        "## 方法与复现",
        "",
        "- 同一份 `create.sql` 建两个库；基线删除全部 `idx_%` 索引，优化库执行索引迁移，数据行相同。",
        "- 13 条查询取自 service SQL；128 MB page cache、双向预热、5 轮交错采样，取 p50 / p95 / p99。",
        "- 写入测试交错执行并关闭 fsync，单独观察索引维护成本；库文件放在本地临时目录。",
        "- 只测数据库层，不含 HTTP 与序列化。",
        "",
        "```bash",
        "python3 scripts/benchmark.py",
        "python3 scripts/make_report.py",
        "sqlite3 pjDB.db < database/indexes.sql",
        "```",
        "",
        "演示库 `pjDB.db` 已应用这 6 条索引，时间票与选课查询的 `EXPLAIN QUERY PLAN` 已确认走索引。",
        "完整图表与执行计划：`reports/optimization-report.html`。",
    ]
    md_path = REPORT_DIR / "optimization-report.md"
    md_path.write_text("\n".join(md_lines) + "\n", encoding="utf-8")

    print(f"Wrote {html_path}")
    print(f"Wrote {md_path}")


if __name__ == "__main__":
    main()
