export function doSomething(el){
  const out = el.querySelector('#example-output');
  out.textContent = `Action performed at ${new Date().toLocaleTimeString()}`;
}
