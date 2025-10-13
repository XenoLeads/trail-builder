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
let grid_size = 15;
let game_tick = 100;
let x_velocity = 0;
let y_velocity = 0;
const head = {
  x: null,
  y: null,
};
let previous_timestamp = 0;
const blocks = [];
const target = {
  x: null,
  y: null,
};

function init() {
  set_canvas_size();
  set_cell_size();
  clear_canvas();

  const random_available_cell = get_random_available_cell();
  blocks.push({
    x: random_available_cell[0],
    y: random_available_cell[1],
  });
  update_head_position(blocks[0].x, blocks[0].y);

  const random_available_cell_for_target = get_random_available_cell();
  target.x = random_available_cell_for_target[0];
  target.y = random_available_cell_for_target[1];

  draw();
  animate(previous_timestamp);

  window.onresize = set_canvas_size;
  window.onkeydown = event => change_direction(event.key.toLowerCase());

  move_buttons.map(move_button => (move_button.onclick = handle_change_direction_button_click));

  document.getElementById("body").removeAttribute("style");
}

function set_canvas_size() {
  canvas_size = get_canvas_size();
  canvas.width = canvas_size;
  canvas.height = canvas_size;
  function get_canvas_size(margin = 7 / 10) {
    const is_landscape = window.innerHeight < window.innerWidth;
    if (is_landscape) return get_nearest_rounded_multiple(window.innerHeight * margin, grid_size);
    return get_nearest_rounded_multiple(window.innerWidth * margin, grid_size);
  }
}

function get_nearest_rounded_multiple(number, nearest_multiple_number) {
  return Math.round(number / nearest_multiple_number) * nearest_multiple_number;
}

function set_cell_size() {
  cell_size = canvas_size / grid_size;
}

function clear_canvas() {
  ctx.fillStyle = "#1C1C1C";
  ctx.fillRect(0, 0, canvas_size, canvas_size);
}

function get_available_cells() {
  const available_cells = [];
  for (let i = 0; i < canvas_size; i += cell_size)
    for (let j = 0; j < canvas_size; j += cell_size) {
      const is_the_cell_occupied_by_a_block = () => blocks.some(block => block.x === i && block.y === j);
      if (is_the_cell_occupied_by_a_block()) continue;
      available_cells.push([i, j]);
    }
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

function move(grow = false) {
  const new_head = get_next_head();
  // Return false if the game will be over after the next move
  if (is_game_over(new_head.x, new_head.y)) return false;
  update_head_position(new_head.x, new_head.y);
  blocks.unshift(new_head);
  if (!grow) blocks.pop();
  // Return true if the move is valid
  return true;
}

function get_next_head() {
  const new_head = {
    x: (head.x += cell_size * x_velocity),
    y: (head.y += cell_size * y_velocity),
  };
  return new_head;
}

function update_head_position(x, y) {
  head.x = x;
  head.y = y;
}

function change_direction(direction) {
  const keymap = {
    up: ["up", "arrowup", "w", "8"],
    right: ["right", "arrowright", "d", "6"],
    down: ["down", "arrowdown", "s", "2"],
    left: ["left", "arrowleft", "a", "4"],
  };
  const pressed_key = direction.toLowerCase();
  for (let key in keymap) {
    if (keymap[key].includes(pressed_key)) {
      switch (key) {
        case "up":
          if (y_velocity === 0) {
            x_velocity = 0;
            y_velocity = -1;
          }
          break;
        case "right":
          if (x_velocity === 0) {
            x_velocity = 1;
            y_velocity = 0;
          }
          break;
        case "down":
          if (y_velocity === 0) {
            x_velocity = 0;
            y_velocity = 1;
          }
          break;
        case "left":
          if (x_velocity === 0) {
            x_velocity = -1;
            y_velocity = 0;
          }
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

function draw(blocks_color = "skyblue", target_color = "lime") {
  // Draw Target
  ctx.fillStyle = target_color;
  ctx.fillRect(target.x, target.y, cell_size, cell_size);

  // Draw Blocks
  ctx.fillStyle = blocks_color;
  blocks.forEach(block => ctx.fillRect(block.x, block.y, cell_size, cell_size));
}

function respawn_target() {
  const random_cell = get_random_available_cell();
  target.x = random_cell[0];
  target.y = random_cell[1];
}

function animate(timestamp) {
  let is_next_move_valid = true;
  const frame_time = timestamp - previous_timestamp;
  if (frame_time > game_tick) {
    previous_timestamp = timestamp;
    const distance = calculate_distance(head.x, head.y, target.x, target.y);
    if (distance < cell_size / 2) {
      is_next_move_valid = move(true);
      respawn_target();
    } else is_next_move_valid = move();

    clear_canvas();
    if (!is_next_move_valid) {
      cancelAnimationFrame(animate);
      draw("red");
    } else draw();
  }
  if (is_next_move_valid) requestAnimationFrame(animate);
}

function calculate_distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function is_game_over(x, y) {
  if (x >= canvas_size || x < 0 || y >= canvas_size || y < 0) return true;
  if (blocks.length > 5) {
    for (let i = 1; i < blocks.length; i++) {
      const self_hit = calculate_distance(x, y, blocks[i].x, blocks[i].y) < cell_size / 4;
      if (self_hit) return true;
    }
  }
  return false;
}

init();
