import "../styles/style.css";

const canvas = document.getElementsByClassName("canvas")[0];
const ctx = canvas.getContext("2d");
const button_move_up = document.getElementsByClassName("button-move-up")[0];
const button_move_right = document.getElementsByClassName("button-move-right")[0];
const button_move_down = document.getElementsByClassName("button-move-down")[0];
const button_move_left = document.getElementsByClassName("button-move-left")[0];
const move_buttons = [button_move_up, button_move_right, button_move_down, button_move_left];

let canvas_size;
let cell_size;
let game_tick = 100;
let x_velocity = 1;
let y_velocity = 0;
let previous_timestamp = 0;
const blocks = [];

function init() {
  set_canvas_size();
  set_cell_size();
  clear_canvas();

  const random_available_cell = get_random_available_cell();
  blocks.push({
    x: random_available_cell[0],
    y: random_available_cell[1],
  });

  draw();
  animate(previous_timestamp);

  window.onresize = set_canvas_size;
  window.onkeydown = event => change_direction(event.key.toLowerCase());

  move_buttons.map(move_button => (move_button.onclick = handle_change_direction_button_click));
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

function move() {
  blocks[0].x += cell_size * x_velocity;
  blocks[0].y += cell_size * y_velocity;
}

function change_direction(direction) {
  const keymap = {
    up: ["up", "arrowup", "w", "8"],
    right: ["right", "arrowright", "d", "6"],
    down: ["down", "arrowdown", "s", "2"],
    left: ["left", "arrowleft", "a", "4"],
  };
  const pressed_key = direction.toLowerCase();
  console.log("Pressed Key:", pressed_key[0].toUpperCase() + pressed_key.slice(1).toLowerCase());
  for (let key in keymap) {
    if (keymap[key].includes(pressed_key)) {
      switch (key) {
        case "up":
          if (y_velocity === 0) {
            x_velocity = 0;
            y_velocity = -1;
          }
          console.log("Changed Direction: Up");
          break;
        case "right":
          if (x_velocity === 0) {
            x_velocity = 1;
            y_velocity = 0;
          }
          console.log("Changed Direction: Right");
          break;
        case "down":
          if (y_velocity === 0) {
            x_velocity = 0;
            y_velocity = 1;
          }
          console.log("Changed Direction: Down");
          break;
        case "left":
          if (x_velocity === 0) {
            x_velocity = -1;
            y_velocity = 0;
          }
          console.log("Changed Direction: Left");
          break;
      }
      break;
    }
  }
}

function handle_change_direction_button_click(event) {
  const direction = event.currentTarget.dataset.direction;
  change_direction(direction);
}

function draw() {
  ctx.fillStyle = "skyblue";
  ctx.fillRect(blocks[0].x, blocks[0].y, cell_size, cell_size);
}

function animate(timestamp) {
  const frame_time = timestamp - previous_timestamp;
  if (frame_time > game_tick) {
    console.log("Frame Time:", frame_time);
    previous_timestamp = timestamp;
    move();
    clear_canvas();
    draw();
  }
  requestAnimationFrame(animate);
}

init();
