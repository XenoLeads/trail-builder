import "../styles/style.css";

const canvas = document.getElementsByClassName("canvas")[0];
const ctx = canvas.getContext("2d");
const button_move_up = document.getElementsByClassName("button-move-up")[0];
const button_move_right = document.getElementsByClassName("button-move-right")[0];
const button_move_down = document.getElementsByClassName("button-move-down")[0];
const button_move_left = document.getElementsByClassName("button-move-left")[0];
const game_over_panel_container = document.getElementsByClassName("game-over-panel-container")[0];
const restart_game_button = document.getElementsByClassName("restart-game-button")[0];
const current_score_display = document.getElementsByClassName("current-score")[0];
const high_score_display = document.getElementsByClassName("high-score")[0];
const grid_size_input = document.getElementsByClassName("grid-size-input")[0];
const move_buttons = [button_move_up, button_move_right, button_move_down, button_move_left];

let canvas_size;
let cell_size;
const grid_size_limit = {
  min: 10,
  max: 20,
};
let previous_grid_size = 15;
let grid_size = 15;
let game_tick = 100;
let x_velocity = 0;
let y_velocity = 0;
let score = 0;
let stored_high_score = parseInt(localStorage.getItem("high_score"));
let high_score = stored_high_score || 0;
const head = {
  row: null,
  column: null,
};
let previous_timestamp = 0;
const blocks = [];
const target = {
  row: null,
  column: null,
};

function init() {
  start_game();

  window.onresize = () => {
    set_canvas_size();
    set_cell_size();
  };
  window.onkeydown = event => {
    const pressed_key = event.key.toLowerCase();
    if (pressed_key === "enter" && game_over_panel_container.classList.contains("visible")) restart_game_button.click();
    else if (!is_grid_size_input_active()) change_direction(pressed_key);
  };

  move_buttons.map(move_button => (move_button.onclick = handle_change_direction_button_click));

  document.getElementById("body").removeAttribute("style");
  restart_game_button.onclick = () => {
    game_over_panel(false);
    restart_game();
  };
  grid_size_input.addEventListener("input", () => {
    const new_grid_size = parseInt(grid_size_input.value) || 0;
    if (new_grid_size === previous_grid_size) return;
    if (new_grid_size > grid_size_limit.max) {
      grid_size_input.value = grid_size_limit.max;
    } else if (!(new_grid_size < grid_size_limit.min)) {
      previous_grid_size = new_grid_size;
      grid_size = new_grid_size;
      restart_game();
    }
  });
}

function is_grid_size_input_active() {
  return document.activeElement === grid_size_input;
}

function set_canvas_size() {
  canvas_size = get_canvas_size();
  canvas.width = canvas_size;
  canvas.height = canvas_size;
  function get_canvas_size(margin = 3 / 5) {
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
  for (let i = 0; i < grid_size; i++)
    for (let j = 0; j < grid_size; j++) {
      const is_the_cell_occupied_by_a_block = () => blocks.some(block => block.row === i && block.column === j);
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
  if (is_game_over(new_head.row, new_head.column)) return false;
  update_head_position(new_head.row, new_head.column);
  blocks.unshift(new_head);
  if (!grow) blocks.pop();
  // Return true if the move is valid
  return true;
}

function get_next_head() {
  const new_head = {
    row: (head.row += x_velocity),
    column: (head.column += y_velocity),
  };
  return new_head;
}

function update_head_position(row, column) {
  head.row = row;
  head.column = column;
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
  if (is_grid_size_input_active()) return;
  const direction = event.currentTarget.dataset.direction;
  change_direction(direction);
}

function draw(head_color = "#87ceeb", body_color_1 = " #66c1e5", body_color_2 = "#7ccae9", target_color = "#01ff00") {
  // Draw Target
  ctx.fillStyle = target_color;
  const target_coordinates = [target.row * cell_size, target.column * cell_size];
  ctx.fillRect(target_coordinates[0], target_coordinates[1], cell_size, cell_size);

  // Draw Blocks
  blocks.forEach((block, index) => {
    if (index === 0) ctx.fillStyle = head_color;
    else if (index % 2 === 0) ctx.fillStyle = body_color_1;
    else ctx.fillStyle = body_color_2;
    const block_coordinates = [block.row * cell_size, block.column * cell_size];
    ctx.fillRect(block_coordinates[0], block_coordinates[1], cell_size, cell_size);
  });
}

function respawn_target() {
  const random_cell = get_random_available_cell();
  target.row = random_cell[0];
  target.column = random_cell[1];
}

function animate(timestamp) {
  let is_next_move_valid = true;
  const frame_time = timestamp - previous_timestamp;
  if (frame_time > game_tick) {
    previous_timestamp = timestamp;
    const hit_the_target = head.row === target.row && head.column === target.column;
    if (hit_the_target) {
      is_next_move_valid = move(true);
      respawn_target();
      increment_score();
      update_score_display(score, high_score);
    } else is_next_move_valid = move();

    clear_canvas();
    if (!is_next_move_valid) {
      cancelAnimationFrame(animate);
      draw("#ff0000", "#cc0000", "#e60000");
      game_over_panel();
    } else draw();
  }
  if (is_next_move_valid) requestAnimationFrame(animate);
}

function is_game_over(row, column) {
  if (row >= grid_size || row < 0 || column >= grid_size || column < 0) return true;
  if (blocks.length > 5) {
    for (let i = 1; i < blocks.length; i++) {
      const self_hit = row === blocks[i].row && column === blocks[i].column;
      if (self_hit) return true;
    }
  }
  return false;
}

function start_game() {
  set_canvas_size();
  set_cell_size();
  clear_canvas();

  const random_available_cell = get_random_available_cell();
  blocks.push({
    row: random_available_cell[0],
    column: random_available_cell[1],
  });
  update_head_position(blocks[0].row, blocks[0].column);

  const random_available_cell_for_target = get_random_available_cell();
  target.row = random_available_cell_for_target[0];
  target.column = random_available_cell_for_target[1];

  draw();
  animate(previous_timestamp);
  update_score_display(score, high_score);
}

function restart_game() {
  reset_variables();
  start_game();
}

function reset_variables() {
  head.row = null;
  head.column = null;
  target.row = null;
  target.column = null;
  blocks.length = 0;
  previous_timestamp = 0;
  x_velocity = 0;
  y_velocity = 0;
  score = 0;
}

function update_score_display(score = null, high_score = null) {
  if (Number.isInteger(score)) current_score_display.textContent = score;
  if (Number.isInteger(high_score)) high_score_display.textContent = high_score;
}

function increment_score() {
  score++;
  if (score > high_score) {
    high_score = score;
    localStorage.setItem("high_score", high_score);
  }
}

function game_over_panel(show = true) {
  if (show) game_over_panel_container.classList.add("visible");
  else game_over_panel_container.classList.remove("visible");
}

init();
