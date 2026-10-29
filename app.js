const ICONS = {
  download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  external: '<path d="M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
};
const GITHUB_FILL = '<path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.7 4.8 18.7 5.1 18.7 5.1c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A11.5 11.5 0 0 0 12 .5z"/>';
const CHEVRON = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

const $ = (id) => document.getElementById(id);

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c) node.append(c);
  return node;
}

function svg(paths) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  node.setAttribute("viewBox", "0 0 24 24");
  node.setAttribute("aria-hidden", "true");
  node.innerHTML = paths;
  return node;
}

function icon(name) {
  return svg(ICONS[name]);
}

function button(label, iconName, cls, props = {}) {
  const tag = props.href ? "a" : "button";
  if (tag === "button") props.type = "button";
  return el(tag, { class: `btn ${cls}`, ...props }, [icon(iconName), document.createTextNode(label)]);
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove("show"), 1800);
}

async function copyEmail(email) {
  try {
    await navigator.clipboard.writeText(email);
    toast("Email copied to clipboard");
  } catch (e) {
    window.location.href = `mailto:${email}`;
  }
}

function contactButtons(cv, withPdf) {
  const list = [];
  if (withPdf) list.push(button("Download CV", "download", "btn--primary", { href: cv.pdf, download: "" }));
  list.push(button("Email", "mail", withPdf ? "btn--ghost" : "btn--primary", { href: `mailto:${cv.email}` }));
  list.push(button("Copy email", "copy", "btn--ghost", { onclick: () => copyEmail(cv.email) }));
  list.push(button("LinkedIn", "linkedin", "btn--ghost", { href: cv.linkedin, target: "_blank", rel: "noopener" }));
  return list;
}

function renderHero(cv) {
  document.title = `${cv.name} — ${cv.title}`;
  $("name").textContent = cv.name;
  $("title").textContent = cv.title;
  $("location").textContent = cv.location;
  $("summary").textContent = cv.summary;
  $("highlights").append(...cv.highlights.map((h) =>
    el("div", { class: "stat" }, [el("b", { text: h.value }), el("span", { text: h.label })])
  ));
  $("actions").append(...contactButtons(cv, true));
  $("contact-actions").append(...contactButtons(cv, true));
  $("footer-name").textContent = cv.name;
  $("year").textContent = new Date().getFullYear();
}

function chip(name, used) {
  if (!used) return el("li", {}, el("span", { class: "chip", text: name, style: "cursor:default" }));
  return el("li", {}, el("button", { type: "button", class: "chip", "data-skill": name, "aria-pressed": "false", text: name }));
}

function renderSkills(cv, usedSkills) {
  $("skills-list").append(...cv.skills.map((g) =>
    el("div", { class: "skill-group reveal" }, [
      el("h3", { text: g.group }),
      el("ul", { class: "chips" }, g.items.map((s) => chip(s, usedSkills.has(s))))
    ])
  ));
}

function techChips(tech) {
  return el("ul", { class: "chips" }, tech.map((t) => chip(t, true)));
}

function renderExperience(cv) {
  cv.experience.forEach((job, i) => {
    const bodyId = `job-body-${i}`;
    const head = el("button", { type: "button", class: "job__head", "aria-expanded": "false", "aria-controls": bodyId }, [
      el("span", {}, [
        el("span", { class: "job__role", text: job.role }),
        el("span", { class: "job__company", text: `${job.company} · ${job.location}` })
      ]),
      el("span", { class: "job__meta", html: `<span class="period"></span>${CHEVRON}` })
    ]);
    head.querySelector(".period").textContent = job.period;

    const content = el("div", { class: "job__content" }, [
      job.about ? el("p", { class: "job__about", text: job.about }) : null,
      el("ul", { class: "points" }, job.points.map((p) => el("li", { text: p }))),
      job.tech.length ? techChips(job.tech) : null
    ]);

    const item = el("li", { class: "job reveal", "data-tech": JSON.stringify(job.tech) }, [
      el("div", { class: "card" }, [head, el("div", { class: "job__body", id: bodyId }, el("div", {}, content))])
    ]);
    head.addEventListener("click", () => setOpen(item, !item.classList.contains("open")));
    if (i === 0) setOpen(item, true);
    $("experience-list").append(item);
  });

  $("toggle-all").addEventListener("click", (e) => {
    const jobs = [...document.querySelectorAll(".job")];
    const open = !jobs.every((j) => j.classList.contains("open"));
    jobs.forEach((j) => setOpen(j, open));
    e.currentTarget.textContent = open ? "Collapse all" : "Expand all";
  });
}

function setOpen(item, open) {
  item.classList.toggle("open", open);
  item.querySelector(".job__head").setAttribute("aria-expanded", String(open));
}

function renderProjects(cv) {
  $("projects-list").append(...cv.projects.map((p) =>
    el("article", { class: "card project reveal", "data-tech": JSON.stringify(p.tech) }, [
      el("div", { class: "project__meta" }, [
        el("span", { class: "badge", text: p.kind }),
        p.period ? el("span", { class: "period", text: p.period }) : null
      ]),
      el("h3", { text: p.name }),
      el("p", { class: "project__tagline", text: p.tagline }),
      el("p", { text: p.about }),
      el("ul", { class: "points" }, p.points.map((x) => el("li", { text: x }))),
      techChips(p.tech),
      p.demo ? el("div", { class: "demo" }, [
        el("a", { class: "btn btn--primary", href: p.demo.url, target: "_blank", rel: "noopener" }, [icon("external"), document.createTextNode(p.demo.label)]),
        p.demo.note ? el("span", { class: "demo__note", text: p.demo.note }) : null
      ]) : null,
      el("div", { class: "repo-links" }, p.links.map((l) =>
        el("a", { class: "repo-link", href: l.url, target: "_blank", rel: "noopener" }, [
          svg(GITHUB_FILL),
          document.createTextNode(l.label)
        ])
      ))
    ])
  ));
}

function renderEducation(cv) {
  $("education-list").append(...cv.education.map((e) =>
    el("li", {}, [el("strong", { text: e.title }), el("span", { text: `${e.place} · ${e.period}` })])
  ));
  $("languages-list").append(...cv.languages.map((l) =>
    el("li", {}, [el("strong", { text: l.name }), el("span", { text: l.level })])
  ));
  $("military").textContent = cv.military;
}

function setupFilter() {
  const targets = [...document.querySelectorAll("[data-tech]")];
  let active = null;

  function apply(skill) {
    active = skill;
    document.querySelectorAll(".chip[data-skill]").forEach((c) => {
      c.setAttribute("aria-pressed", String(c.dataset.skill === skill));
      c.classList.toggle("is-used", false);
    });
    $("filter-bar").hidden = !skill;
    if (skill) $("filter-name").textContent = skill;

    let first = null;
    targets.forEach((t) => {
      const match = skill && JSON.parse(t.dataset.tech).includes(skill);
      t.classList.toggle("is-match", !!match);
      t.classList.toggle("is-dim", !!skill && !match);
      if (match) {
        if (t.classList.contains("job")) setOpen(t, true);
        t.querySelectorAll(`.chip[data-skill="${CSS.escape(skill)}"]`).forEach((c) => c.classList.add("is-used"));
        first = first || t;
      }
    });
    return first;
  }

  document.addEventListener("click", (e) => {
    const c = e.target.closest(".chip[data-skill]");
    if (!c) return;
    const skill = c.dataset.skill === active ? null : c.dataset.skill;
    const first = apply(skill);
    if (first && c.closest("#skills")) {
      toast(`${document.querySelectorAll(".is-match").length} place(s) using ${skill}`);
    } else if (first && !first.contains(c)) {
      first.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  $("filter-clear").addEventListener("click", () => apply(null));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && active) apply(null); });
}

function setupTheme() {
  $("theme-toggle").addEventListener("click", () => {
    const root = document.documentElement;
    const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
}

function setupScrollEffects() {
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        reveal.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px -40px 0px" });
  document.querySelectorAll(".reveal").forEach((n) => reveal.observe(n));

  const links = [...document.querySelectorAll("#nav a")];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${en.target.id}`));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((a) => {
    const s = document.querySelector(a.getAttribute("href"));
    if (s) spy.observe(s);
  });
}

async function init() {
  setupTheme();
  try {
    const res = await fetch("cv.json", { cache: "no-cache" });
    const cv = await res.json();
    const used = new Set([...cv.experience, ...cv.projects].flatMap((x) => x.tech));
    renderHero(cv);
    renderSkills(cv, used);
    renderExperience(cv);
    renderProjects(cv);
    renderEducation(cv);
    setupFilter();
    setupScrollEffects();
  } catch (e) {
    $("summary").textContent = "Could not load cv.json. If you opened index.html directly from disk, run a local server instead (python3 -m http.server).";
  }
}

init();
