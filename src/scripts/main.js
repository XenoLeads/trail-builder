import "../styles/style.css";

const container = document.getElementById("container");
const canvas = document.getElementsByClassName("canvas")[0];
const ctx = canvas.getContext("2d");
const button_move_up = document.getElementsByClassName("button-move-up")[0];
const button_move_right = document.getElementsByClassName("button-move-right")[0];
const button_move_down = document.getElementsByClassName("button-move-down")[0];
const button_move_left = document.getElementsByClassName("button-move-left")[0];
const game_over_panel_container = document.getElementsByClassName("game-over-panel-container")[0];
const game_over_panel_heading = document.getElementsByClassName("game-over-panel-heading")[0];
const game_over_panel_message = document.getElementsByClassName("game-over-panel-message")[0];
const restart_game_button = document.getElementsByClassName("restart-game-button")[0];
const current_score_display = document.getElementsByClassName("current-score")[0];
const high_score_display = document.getElementsByClassName("high-score")[0];
const grid_size_input = document.getElementsByClassName("grid-size-input")[0];
const game_tick_input = document.getElementsByClassName("game-tick-input")[0];
const toggle_settings_button = document.getElementsByClassName("toggle-settings-button")[0];
const toggle_light_dark_mode_button = document.getElementsByClassName("toggle-light-dark-mode-button")[0];
const icons = [...document.querySelectorAll("[data-icon-name]")];
const input_elements = [grid_size_input, game_tick_input];
const move_buttons = [button_move_up, button_move_right, button_move_down, button_move_left];

let canvas_size;
let cell_size;
const grid_size_limit = {
  min: 10,
  max: 20,
};
let previous_grid_size = 15;
let grid_size = 15;
let previous_game_tick = 100;
const game_tick_limit = {
  min: 50,
  max: 2000,
};
let game_tick = 100;
let processed_tick = false;
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

let is_dark_mode = localStorage.getItem("dark_mode_preference") === "false" ? false : true;

function init() {
  start_game();
  toggle_color_preference(is_dark_mode);

  window.onresize = () => {
    set_canvas_size();
    set_cell_size();
  };
  window.onkeydown = event => {
    const pressed_key = event.key.toLowerCase();
    if (pressed_key === "enter" && game_over_panel_container.classList.contains("visible")) {
      document.activeElement.blur();
      restart_game_button.click();
    } else if (!active_input_element() && processed_tick) change_direction(pressed_key);
  };

  move_buttons.map(move_button => (move_button.onclick = handle_change_direction_button_click));

  document.getElementById("body").removeAttribute("style");
  restart_game_button.onclick = () => {
    game_over_panel(false);
    restart_game();
  };

  grid_size_input.oninput = () => {
    const new_grid_size = parseInt(grid_size_input.value) || 0;
    if (new_grid_size === previous_grid_size) return;
    if (new_grid_size < grid_size_limit.min || new_grid_size > grid_size_limit.max) {
      if (new_grid_size > grid_size_limit.max) grid_size_input.value = grid_size_limit.max;
      grid_size_input.setCustomValidity(`Grid size must be between ${grid_size_limit.min} and ${grid_size_limit.max} cells.`);
      grid_size_input.reportValidity();
    } else {
      previous_grid_size = new_grid_size;
      grid_size = new_grid_size;
      restart_game();
      grid_size_input.setCustomValidity("");
      grid_size_input.reportValidity();
    }
  };

  game_tick_input.oninput = () => {
    const new_game_tick = parseInt(game_tick_input.value) || 0;
    if (new_game_tick === previous_game_tick) return;
    if (new_game_tick < game_tick_limit.min || new_game_tick > game_tick_limit.max) {
      if (new_game_tick > game_tick_limit.max) game_tick_input.value = game_tick_limit.max;
      game_tick_input.setCustomValidity(`Game tick must be between ${game_tick_limit.min} ms and ${game_tick_limit.max} ms.`);
      game_tick_input.reportValidity();
    } else {
      previous_game_tick = new_game_tick;
      game_tick = new_game_tick;
      game_tick_input.setCustomValidity("");
      game_tick_input.reportValidity();
    }
  };

  toggle_settings_button.onclick = () => {
    container.classList.toggle("settings-visible");
  };

  toggle_light_dark_mode_button.onclick = () => {
    if (container.classList.contains("light-mode")) toggle_color_preference();
    else toggle_color_preference(false);
  };
}

function toggle_color_preference(dark_mode = true) {
  if (dark_mode) {
    container.classList.remove("light-mode");
    is_dark_mode = true;
  } else {
    container.classList.add("light-mode");
    is_dark_mode = false;
  }
  change_icon_color(is_dark_mode);
  clear_canvas();
  draw(is_dark_mode);
  localStorage.setItem("dark_mode_preference", dark_mode);
}

function change_icon_color(dark_icon = true) {
  icons.map(icon => {
    const icon_name = icon.dataset.iconName;
    const icon_group_name = icon.dataset.iconGroup;
    get_icon(icon_name, dark_icon, icon_group_name).then(module => {
      const icon_url = module.default;
      icon.src = icon_url;
    });
  });
}

function get_icon(icon_name, dark = true, additional_path = null) {
  return import(`../assets/icons/${dark ? "light" : "dark"}${additional_path ? `/${additional_path}` : ""}/${icon_name}.svg`);
}

function active_input_element() {
  return input_elements.includes(document.activeElement);
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
  if (is_dark_mode) ctx.fillStyle = "#1C1C1C";
  else ctx.fillStyle = "#E3E3E3";
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
  return available_cells.length > 0 ? available_cells : null;
}

function get_random_available_cell() {
  const available_cells = get_available_cells();
  if (available_cells === null) return available_cells;
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
  const new_head = get_next_move();
  update_head_position(new_head.row, new_head.column);
  blocks.unshift(new_head);
  if (!grow) blocks.pop();
}

function get_next_move() {
  const new_head = {
    row: head.row + x_velocity,
    column: head.column + y_velocity,
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
      processed_tick = false;
      break;
    }
  }
}

function handle_change_direction_button_click(event) {
  if (active_input_element() || !processed_tick) return;
  const direction = event.currentTarget.dataset.direction;
  change_direction(direction);
}

function draw(dark_mode = true, head_color = null, body_color_1 = null, body_color_2 = null, target_color = null) {
  clear_canvas();
  const dark_mode_colors = ["#87ceeb", "#66c1e5", "#7ccae9", "#01ff00"];
  const light_mode_colors = ["#2ca7d8", "#31b4e0", "#45c2e8", "#00cc44"];
  if (dark_mode) {
    if (!head_color) head_color = dark_mode_colors[0];
    if (!body_color_1) body_color_1 = dark_mode_colors[1];
    if (!body_color_2) body_color_2 = dark_mode_colors[2];
    if (!target_color) target_color = dark_mode_colors[3];
  } else {
    if (!head_color) head_color = light_mode_colors[0];
    if (!body_color_1) body_color_1 = light_mode_colors[1];
    if (!body_color_2) body_color_2 = light_mode_colors[2];
    if (!target_color) target_color = light_mode_colors[3];
  }

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
  if (random_cell === null) return random_cell;
  target.row = random_cell[0];
  target.column = random_cell[1];
}

function animate(timestamp) {
  let game_over_on_next_move = false;
  const frame_time = timestamp - previous_timestamp;
  if (frame_time > game_tick) {
    previous_timestamp = timestamp;
    const next_move = get_next_move();
    const hit_the_target_on_next_move = next_move.row === target.row && next_move.column === target.column;
    game_over_on_next_move = is_game_over(next_move);
    if (hit_the_target_on_next_move) {
      move(true);
      respawn_target();
      increment_score();
      update_score_display(score, high_score);
    } else move();

    if (game_over_on_next_move) {
      cancelAnimationFrame(animate);
      draw(is_dark_mode, "#ff0000", "#cc0000", "#e60000");
      if (game_over_on_next_move === 1) game_over_panel(true, "", "You crashed into a wall. Watch those edges next time!");
      else game_over_panel(true, "", "You ran into yourself. Careful not to trap your own tail!");
    } else draw(is_dark_mode);

    if (player_won()) {
      cancelAnimationFrame(animate);
      game_over_panel(
        true,
        "You Won!",
        `You've reached the maximum score possible on a ${grid_size}x{$grid_size} grid. Impressive!`
      );
    }
    processed_tick = true;
  }
  if (!game_over_on_next_move && !player_won()) requestAnimationFrame(animate);
}

function is_game_over(move) {
  const row = move.row;
  const column = move.column;
  if (row >= grid_size || row < 0 || column >= grid_size || column < 0) return 1;
  if (blocks.length > 5) {
    for (let i = 1; i < blocks.length; i++) {
      const self_hit = row === blocks[i].row && column === blocks[i].column;
      if (self_hit) return 2;
    }
  }
  return false;
}

function player_won() {
  if (get_available_cells() === null) return true;
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

  draw(is_dark_mode);
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

function game_over_panel(show = true, heading = "", message = "") {
  if (heading) game_over_panel_heading.textContent = heading;
  if (message) game_over_panel_message.textContent = message;
  if (show) game_over_panel_container.classList.add("visible");
  else game_over_panel_container.classList.remove("visible");
}

init();
