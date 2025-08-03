async function fetchQuote() {
  const srcSel = document.getElementById('src');
  const dstSel = document.getElementById('dst');
  const amountEl = document.getElementById('amount');

  const src = srcSel.value;
  const dst = dstSel.value;
  const amount = amountEl.value || "1";
  const decimals = srcSel.selectedOptions[0].dataset.decimals || 18;

  const url = `/api/quote/?src=${encodeURIComponent(src)}&dst=${encodeURIComponent(dst)}&amount=${encodeURIComponent(amount)}&decimals=${decimals}`;
  const res = await fetch(url);
  const json = await res.json();

  const routeEl = document.getElementById('route');
  const riskEl = document.getElementById('risk');
  const explainEl = document.getElementById('explain');

  if (json.ok) {
    routeEl.textContent = JSON.stringify(json.data.route || json.data, null, 2);
    riskEl.textContent = `Slippage: ${json.risk.slippage} | Price Impact (bps): ${json.risk.price_impact_bps}`;

    const explainRes = await fetch(`/api/explain/?route_summary=${encodeURIComponent('best route')}&risk=${encodeURIComponent(json.risk.slippage)}`);
    const explainData = await explainRes.json();
    explainEl.textContent = explainData.explanation;
  } else {
    routeEl.textContent = "Error: " + json.error;
    riskEl.textContent = "";
    explainEl.textContent = "";
  }
}
