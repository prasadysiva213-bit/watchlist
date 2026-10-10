const SUPABASE_URL = "https://otblzwrwtdlryxkniroo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90Ymx6d3J3dGRscnl4a25pcm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDc0ODcsImV4cCI6MjEwNzIyMzQ4N30.rG0YqFsx5mihCRmcTr5GB9GuXO1UUOSAyMtztPiSGiw";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = i => document.getElementById(i);
const rank = {Bad:1, Average:2, Good:3, "Above average":4, Best:5};
const rc = {Best:"var(--acc)", "Above average":"#2f9e6b", Good:"#3b82c4", Average:"#c08a1e", Bad:"#d24b4b"};
const tabs = [["all","All"],["watched","Watched"],["continuing","Continuing"],["planned","Plan to watch"]];
let items = [], extra = ["K-dramas"], cur = "K-dramas", tab = "all", editId = null;
const esc = t => { const d = document.createElement("div"); d.textContent = t == null ? "" : t; return d.innerHTML; };
const show = on => { $("login").hidden = on; $("app").hidden = !on; };

sb.auth.onAuthStateChange((ev, s) => {
  if (ev === "TOKEN_REFRESHED") return;
  if (s) { show(true); setTimeout(load, 0); } else show(false);
});
$("send").onclick = async () => {
  const em = $("em").value.trim();
  if (!em) { $("lmsg").textContent = "Enter your email first"; return; }
  const { error } = await sb.auth.signInWithOtp({ email: em, options: { emailRedirectTo: location.href.split("#")[0] } });
  $("lmsg").textContent = error ? error.message : "Check your email and open the link.";
};
$("out").onclick = () => sb.auth.signOut();

async function load() {
  const { data, error } = await sb.from("items").select("*").order("created_at");
  if (error) { $("sub").textContent = error.message; return; }
  items = data || [];
  render();
}
function lists() {
  const s = new Set(extra); items.forEach(i => s.add(i.list));
  return [...s];
}
function render() {
  const L = lists(); if (!L.includes(cur)) cur = L[0];
  const mine = items.filter(i => i.list === cur);
  $("title").textContent = cur;
  $("sub").textContent = mine.length + " titles, " + mine.filter(i => i.status === "watched").length + " finished";
  $("side").innerHTML = "<h2>My lists</h2>" + L.map(n => '<button class="li' + (n === cur ? " on" : "") + '" data-l="' + esc(n) + '">' + esc(n) + "<span>" + items.filter(i => i.list === n).length + "</span></button>").join("") + '<button class="plus" id="plus" aria-label="Create new list">+</button>';
  document.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { cur = b.dataset.l; tab = "all"; $("g").value = ""; render(); });
  $("plus").onclick = () => { $("listForm").hidden = !$("listForm").hidden; $("ln").focus(); };
  const gs = [...new Set(mine.map(i => i.genre).filter(Boolean))].sort(), gv = $("g").value;
  $("g").innerHTML = '<option value="">All genres</option>' + gs.map(k => "<option" + (k === gv ? " selected" : "") + ">" + esc(k) + "</option>").join("");
  const cnt = s => s === "all" ? mine.length : mine.filter(i => i.status === s).length;
  $("stats").innerHTML = tabs.map(t => '<div class="st"><b>' + cnt(t[0]) + "</b><i>" + (t[0] === "all" ? "Total" : t[1]) + "</i></div>").join("");
  $("tabs").innerHTML = tabs.map(t => '<button data-t="' + t[0] + '" class="' + (tab === t[0] ? "on" : "") + '">' + t[1] + "</button>").join("");
  document.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
  const q = $("q").value.toLowerCase(), g = $("g").value, o = $("o").value;
  const list = mine.filter(d => (tab === "all" || d.status === tab) && (!g || d.genre === g) && d.name.toLowerCase().includes(q));
  if (o === "rating") list.sort((a, b) => rank[b.rating] - rank[a.rating]);
  if (o === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  if (o === "fav") list.sort((a, b) => b.favorite - a.favorite);
  $("rows").innerHTML = list.map((d, k) => {
    const pc = Math.min(100, Math.round(d.ep_watched / d.ep_total * 100));
    const prog = d.status === "planned" ? '<span style="color:var(--mut)">Not started</span>' : '<div class="pg"><div class="bar2"><i style="width:' + pc + '%"></i></div>Ep ' + d.ep_watched + "/" + d.ep_total + (d.status === "continuing" ? ' <button class="ic" data-p="' + d.id + '" aria-label="Add one episode">+1</button>' : "") + "</div>";
    return '<tr><td style="color:var(--mut)">' + (k + 1) + '</td><td><button class="star' + (d.favorite ? " on" : "") + '" data-f="' + d.id + '" aria-label="Favorite">' + (d.favorite ? "\u2605" : "\u2606") + '</button><span class="nm">' + esc(d.name) + "</span>" + (d.description ? '<div class="ds">' + esc(d.description) + "</div>" : "") + '</td><td><span class="bd" style="--c:' + rc[d.rating] + '">' + d.rating + "</span></td><td>" + esc(d.genre) + "</td><td>" + prog + '</td><td style="white-space:nowrap"><button class="ic" data-e="' + d.id + '">Edit</button> <button class="ic" data-x="' + d.id + '">Delete</button></td></tr>';
  }).join("");
  $("empty").hidden = list.length > 0;
  const find = id => items.find(d => d.id === id);
  const upd = async (id, row) => { const { error } = await sb.from("items").update(row).eq("id", id); if (error) $("sub").textContent = error.message; else load(); };
  document.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { const d = find(b.dataset.p), p = d.ep_watched + 1; upd(d.id, p >= d.ep_total ? { ep_watched: d.ep_total, status: "watched" } : { ep_watched: p }); });
  document.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { const d = find(b.dataset.f); upd(d.id, { favorite: !d.favorite }); });
  document.querySelectorAll("[data-x]").forEach(b => b.onclick = async () => { await sb.from("items").delete().eq("id", b.dataset.x); load(); });
  document.querySelectorAll("[data-e]").forEach(b => b.onclick = () => {
    const d = find(b.dataset.e); editId = d.id;
    $("fn").value = d.name; $("fg").value = d.genre; $("fr").value = d.rating; $("fs").value = d.status;
    $("fp").value = d.ep_watched; $("ft").value = d.ep_total; $("fd").value = d.description || "";
    $("form").hidden = false; $("fn").focus();
  });
}
function clearForm() { editId = null; ["fn","fg","fp","ft","fd"].forEach(i => $(i).value = ""); $("err").textContent = ""; }
$("addBtn").onclick = () => { clearForm(); $("form").hidden = !$("form").hidden; };
$("cancel").onclick = () => { clearForm(); $("form").hidden = true; };
$("fn").oninput = () => $("err").textContent = "";
$("save").onclick = async () => {
  const name = $("fn").value.trim();
  if (!name) { $("err").textContent = "Enter a name first"; return; }
  const status = $("fs").value;
  const t = Math.max(1, parseInt($("ft").value, 10) || 1);
  let p = Math.max(0, parseInt($("fp").value, 10) || 0);
  if (status === "watched") p = t; if (status === "planned") p = 0; if (p > t) p = t;
  const row = { list: cur, name, rating: $("fr").value, genre: $("fg").value.trim() || "Other", status, ep_watched: p, ep_total: t, description: $("fd").value.trim() };
  const r = editId ? await sb.from("items").update(row).eq("id", editId) : await sb.from("items").insert(row);
  if (r.error) { $("err").textContent = r.error.message; return; }
  clearForm(); $("form").hidden = true; load();
};
$("lsave").onclick = () => {
  const n = $("ln").value.trim();
  if (!n) { $("lerr").textContent = "Enter a list name first"; return; }
  if (!lists().includes(n)) extra.push(n);
  cur = n; tab = "all"; $("ln").value = ""; $("listForm").hidden = true; render();
};
$("ln").oninput = () => $("lerr").textContent = "";
["q","g","o"].forEach(i => $(i).oninput = render);
$("pickBtn").onclick = () => {
  const pl = items.filter(i => i.list === cur && i.status === "planned"), box = $("pick");
  if (!pl.length) { box.textContent = "Your Plan to watch list is empty. Add something you want to try next."; box.hidden = false; return; }
  const d = pl[Math.floor(Math.random() * pl.length)];
  box.innerHTML = '<div class="sub">Tonight\'s pick</div><h3>' + esc(d.name) + '</h3><div class="sub" style="margin-bottom:10px">' + esc(d.genre) + " \u00b7 " + d.ep_total + ' episodes</div><div class="row"><button class="pri" id="go">Start watching</button><button id="again">Pick another</button><button id="close">Close</button></div>';
  box.hidden = false;
  $("go").onclick = async () => { box.hidden = true; await sb.from("items").update({ status: "continuing" }).eq("id", d.id); load(); };
  $("again").onclick = $("pickBtn").onclick;
  $("close").onclick = () => box.hidden = true;
};
function theme(t) { document.documentElement.setAttribute("data-theme", t); $("thBtn").textContent = t === "dark" ? "Light mode" : "Dark mode"; try { localStorage.setItem("wl-theme", t); } catch (e) {} }
let th = null; try { th = localStorage.getItem("wl-theme"); } catch (e) {}
theme(th || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("thBtn").onclick = () => theme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
