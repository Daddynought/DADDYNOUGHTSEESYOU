(function () {
  var KEY = 'dns_history_v1';
  var $ = function (id) { return document.getElementById(id); };
  var cc = $('cc'), num = $('num'), form = $('form'), go = $('go'), err = $('error');
  var lastCheck = null;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(h) { try { localStorage.setItem(KEY, JSON.stringify(h.slice(0, 100))); } catch (e) {} }
  function when(iso) { return new Date(iso).toLocaleString(); }

  function item(entry, showNumber) {
    var li = document.createElement('li');
    li.className = 'item';
    var left = document.createElement('div');
    var t = document.createElement('div');
    t.textContent = showNumber ? entry.formatted : when(entry.checkedAt);
    left.appendChild(t);
    if (showNumber) {
      var m = document.createElement('div');
      m.className = 'meta'; m.textContent = when(entry.checkedAt);
      left.appendChild(m);
    }
    var st = document.createElement('span');
    st.className = 'st ' + entry.status.toLowerCase();
    var d = document.createElement('i'); d.className = 'dot';
    st.appendChild(d); st.appendChild(document.createTextNode(entry.status));
    li.appendChild(left); li.appendChild(st);
    return li;
  }

  function fill(ul, entries, showNumber, emptyText) {
    ul.textContent = '';
    if (!entries.length) {
      var li = document.createElement('li'); li.className = 'empty'; li.textContent = emptyText; ul.appendChild(li); return;
    }
    entries.forEach(function (e) { ul.appendChild(item(e, showNumber)); });
  }

  function render() {
    var h = load();
    fill($('history'), h.slice(0, 10), true, 'No checks yet. Enter a number above.');
    $('s-total').textContent = h.length;
    $('s-unique').textContent = new Set(h.map(function (x) { return x.e164; })).size;
    $('s-online').textContent = h.filter(function (x) { return x.status === 'ONLINE'; }).length;
    $('s-unknown').textContent = h.filter(function (x) { return x.status === 'UNKNOWN'; }).length;
  }

  function showResult(r) {
    $('result').hidden = false;
    $('r-number').textContent = r.formatted;
    $('r-time').textContent = when(r.checkedAt);
    $('r-reason').textContent = r.reason || '';
    $('r-reason').hidden = !r.reason;
    var b = $('r-badge');
    b.className = 'badge ' + r.status.toLowerCase();
    b.querySelector('b').textContent = r.status;
    fill($('r-history'), load().filter(function (x) { return x.e164 === r.e164; }).slice(0, 10), false, 'No history yet.');
  }

  function groupPreview() {
    var digits = num.value.replace(/\D/g, '').replace(/^0+/, '');
    var g = digits.match(/.{1,3}/g);
    $('preview').textContent = 'Formatted: ' + (digits ? '+' + cc.value + ' ' + g.join(' ') : '—');
  }

  async function check(code, number) {
    err.textContent = '';
    go.disabled = true; go.classList.add('loading');
    try {
      var res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: code, number: number })
      });
      var data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed.');
      var h = load();
      h.unshift({ code: code, number: number, e164: data.e164, formatted: data.formatted, status: data.status, checkedAt: data.checkedAt });
      save(h);
      lastCheck = { code: code, number: number };
      showResult(data); render();
    } catch (e) {
      err.textContent = e.message === 'Failed to fetch' ? 'Cannot reach the server. Check your connection.' : e.message;
    } finally {
      go.disabled = false; go.classList.remove('loading');
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var n = num.value.replace(/[\s\-().]/g, '');
    if (!/^\d{4,14}$/.test(n)) { err.textContent = 'Enter digits only (4 to 14 digits).'; return; }
    check(cc.value, n);
  });
  num.addEventListener('input', groupPreview);
  cc.addEventListener('change', groupPreview);

  $('refresh').addEventListener('click', function () {
    var h = load();
    var t = lastCheck || (h.length && h[0].code ? { code: h[0].code, number: h[0].number } : null);
    if (t) check(t.code, t.number); else render();
  });
  $('clear').addEventListener('click', function () {
    if (!confirm('Clear all search history from this browser?')) return;
    localStorage.removeItem(KEY); lastCheck = null; $('result').hidden = true; render();
  });

  fetch('/api/countries').then(function (r) { return r.json(); }).then(function (d) {
    d.countries.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.code; o.textContent = c.name + ' (+' + c.code + ')';
      cc.appendChild(o);
    });
    cc.value = '234'; groupPreview();
  }).catch(function () { err.textContent = 'Could not load country list. Refresh the page.'; });

  render();
})();
