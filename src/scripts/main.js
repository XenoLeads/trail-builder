import "../styles/style.css";

const canvas = document.getElementsByClassName("canvas")[0];
const ctx = canvas.getContext("2d");

let canvas_size;

function init() {
  set_canvas_size();
  clear_canvas();
  window.onresize = set_canvas_size;
}

function set_canvas_size() {
  canvas_size = get_canvas_size();
  canvas.width = canvas_size;
  canvas.height = canvas_size;
  function get_canvas_size(margin = 7 / 10) {
    const is_landscape = window.innerHeight < window.innerWidth;
    if (is_landscape) return window.innerHeight * margin;
    return window.innerWidth * margin;
  }
}

function clear_canvas() {
  ctx.fillStyle = "#1C1C1C";
  ctx.fillRect(0, 0, canvas_size, canvas_size);
}

init();
