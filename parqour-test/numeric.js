
// Force numeric keypad on mobile and keep value digits-only
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[type="number"], input.num, input[data-num="1"]').forEach(inp => {
    inp.type = 'text';
    inp.setAttribute('inputmode', 'numeric');
    inp.setAttribute('pattern', '[0-9]*');
    inp.classList.add('num');
    inp.autocomplete = 'off';
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/[^\d]/g, '');
    });
  });
});
