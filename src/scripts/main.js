import "../styles/style.css";

const canvas = document.getElementsByClassName("canvas")[0];
const ctx = canvas.getContext("2d");

let canvas_size;
let cell_size;

function init() {
  set_canvas_size();
  set_cell_size();
  clear_canvas();

  const random_available_cell = get_random_available_cell();
  ctx.fillStyle = "skyblue";
  ctx.fillRect(random_available_cell[0], random_available_cell[1], cell_size, cell_size);
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
function set_cell_size(blocks = 15) {
  cell_size = canvas_size / blocks;
}

function clear_canvas() {
  ctx.fillStyle = "#1C1C1C";
  ctx.fillRect(0, 0, canvas_size, canvas_size);
}

function get_available_cells() {
  const available_cells = [];
  for (let i = 0; i < canvas_size; i += cell_size) for (let j = 0; j < canvas_size; j += cell_size) available_cells.push([i, j]);
  return available_cells;
}

function get_random_available_cell() {
  const available_cells = get_available_cells();
  const random_index = get_random_range_value(0, available_cells.length - 1);
  const random_cell = available_cells.splice(random_index, 1)[0];
  return random_cell;
}

function get_random_range_value(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

init();
