// The top page: shows each exam's progress, and sends links from the old single-exam site (/#quiz, /#r123) to Ruby Silver.

const OLD_ROUTE = /^#(home|quiz|r\d+)$/;
if (OLD_ROUTE.test(location.hash)) location.replace('/ruby-silver/' + location.hash);

function answered(storage: string): number {
  try {
    const hist: unknown = JSON.parse(localStorage.getItem(`${storage}-hist`) ?? '{}');
    return hist && typeof hist === 'object' ? Object.keys(hist).length : 0;
  } catch {
    return 0;
  }
}

document.querySelectorAll<HTMLElement>('.cert[data-storage]').forEach((el) => {
  const done = answered(el.dataset.storage ?? '');
  const out = el.querySelector<HTMLElement>('.cert-progress');
  if (!out || !done) return;
  out.textContent = `回答した問題 ${Math.min(done, Number(el.dataset.total))} / ${el.dataset.total}`;
  out.hidden = false;
});
