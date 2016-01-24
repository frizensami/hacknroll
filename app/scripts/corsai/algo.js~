var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
function day_to_num(day) {
	return days.indexOf(day);
}

// create_timetable_array: creates a timetable array.
// The array itself is a 2d array, with each element containing an array of which one is filled and which one is not.
// However, if there is a clash, it will return undefined. IT WILL RETURN UNDEFINED.

function create_timetable_array(array_of_mod_objs) {
	var timetable_array = new Array(5);
	for (var i = 0; i < 5; i++) {
		timetable_array[i] = [];
	}
	var timetable_is_ok = true;
	array_of_mod_objs.forEach(function(mod) {
		var times = mod.Timings;
		times.forEach(function(time) {
			var day_index = day_to_num(time.DayText);
			var processed_start = parseInt(time.StartTime) / 100 - 8;
			var processed_end = parseInt(time.EndTime) / 100 - 8;
			for (var i = processed_start; i < processed_end && timetable_is_ok; i++) {
				var the_slot = timetable_array[day_index][i];
				if (typeof the_slot !== "undefined") {
					timetable_is_ok = false;
				} else {
					timetable_array[day_index][i] = true;
				}
			}
		});
	});
	if (timetable_is_ok) {
		return timetable_array;
	} else {
		return undefined;
	}
}

// score_timetable: scores the timetable that is represented by array of module objects.
// The higher the score, the more loosely packed it is. (untighted)
// Very compact = 0
// Method: count number of hours of gaps between modules.
function score_timetable(array_of_mod_objs) {
	var timetable_array = create_timetable_array(array_of_mod_objs);
	var res = 0;
	if (typeof timetable_array !== "undefined") {
		timetable_array.forEach(function(day) {
			var start = false;
			for (var i = 0; i < day.length; i++) {
				var test = day[i];
				if (!start && test === true) {
					start = true;
				} else if (start && test !== true) {
					res++;
				}
			}
		});
		return res;
	} else {
		return undefined;
	}
}

function produce_timetable(culled_arr_arr, tightness) {

	tightness = parseInt(tightness);
	console.log("TIGHTNESS " + tightness);
	var tightness_processed = tightness * 14;
	if (tightness === 5) {
		tightness_processed = 56;
	}
	console.log("PROCESSED " + tightness_processed);
	var choice_constant = sum_of_possibilities(culled_arr_arr);
	console.log("CONSTANT " + choice_constant);
	var score_to_be_found = Math.round(tightness_processed * choice_constant / 200);
	console.log("SCORE " + score_to_be_found);

	var perms_threshold = 20000000;

	var num_of_perms = calculate_possibilities(culled_arr_arr);
	if (calculate_possibilities(culled_arr_arr) > perms_threshold) {
		alert("Cannot find timetable arrangement before the universe ends - permutations: " + num_of_perms);
	} else {
		var representative_array = new Array(culled_arr_arr.length).fill(0);
		function next_representative(the_array) {
			var len = the_array.length;
			the_array[len - 1]++;
			for (var i = len - 1; i >= 0; i--) {
				if (the_array[i] >= culled_arr_arr[i].Timetable.length) {
					if (i !== 0) {
						the_array[i - 1]++;
						the_array[i] = 0;
					} else {
						return undefined;
					}
				}
			}
			return the_array;
		}

		function take_representative(the_array) {
			return culled_arr_arr.map(function(cur, index, arr) {
				return cur.Timetable[the_array[index]];
			});
		}

		while (typeof representative_array !== "undefined") {
			var modules = take_representative(representative_array);
			var score = score_timetable(modules);
			if (tightness !== 5) {
				if (typeof score !== "undefined" && score <= score_to_be_found + 2 && score >= score_to_be_found - 2) {
					console.log("THE FOLLOWING SCORE IS " + score);
					return modules;
				}
			} else {
				if (typeof score !== "undefined" && score > score_to_be_found + 2) {
					console.log("THE FOLLOWING SCORE IS " + score);
					return modules;
				}
			}
			representative_array = next_representative(representative_array);
		}

		console.log(score_to_be_found);
		alert("Sorry! Could not find a configuration for your module tightness score!");
		return undefined;

	}
}

/* calculate_possibilities
 * Checks the number of possibilities (permutations) in the array of array of mod objs.
 */
		
function calculate_possibilities(array_of_array_of_mod_objs) {
	var each_perms = array_of_array_of_mod_objs.map(function(array_of_mods) {
		return array_of_mods.Timetable.length;
	});
	var product_of_lengths = each_perms.reduce(function(prev, cur, index, arr) {
		return prev * cur;
	});
	return product_of_lengths;
}

function sum_of_possibilities(array_of_array_of_mod_objs) {
	var each_perms = array_of_array_of_mod_objs.map(function(array_of_mods) {
		return array_of_mods.Timetable.length;
	});
	var product_of_lengths = each_perms.reduce(function(prev, cur, index, arr) {
		return prev + cur;
	});
	return product_of_lengths;
}
