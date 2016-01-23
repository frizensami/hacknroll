var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
function day_to_num(day) {
  return days.indexOf(day);
}

/* Main function.
 * array_of_array_of_mod_objs is an array from Sriram's output
 * constraints_object is an object containting the constraints
 */

 function dummy(n) {
  var start = new Date().getTime();
  var x = 0;
  for (var i = 0; i < n; i++) {
    Math.random();
  }
  var end = new Date().getTime();
  return end - start;
}

function produce_timetable(array_of_array_of_mod_objs) {
  console.log("Array of array of mod objects");
  console.log(array_of_array_of_mod_objs);

  var perms_threshold = 1000000;

  // This timetable_array is a 3d array. The array itself consists of 5 elements which consist of the days of the week. Each day consists of an array, which itself consists of arrays of modules inside.
  // For example, if Monday 8am and 10am is filled it will be [[[CS1010 lecture, MA1101R tutorial], undefined, [CS1231 lecture, LAC1201 tutorial], ...], ...]
  var timetable_array = [];
  for (var i = 0; i < 5; i++) {
    timetable_array[i] = [];
    var deep_array = timetable_array[i];
    for (var j = 0; j < 16; j++) {
      deep_array[j] = [];
    }
  }

  // Check clashing exams. We iterate through the array. If we found a mod with time already in the list written, but code is not found, that means that there is a exam clash.
  function check_clashing_exam(the_array) {
    var array_of_modules = [];
    for (var i = 0; i < the_array.length; i++) {
      var module = the_array[i];
      var code = module.ModuleCode;
      var time = module.ExamDate;
      if (typeof time !== "undefined") {
        var array_of_times = array_of_modules.map(function(mod) {
          return mod.ExamDate;
        });
        var array_of_codes = array_of_modules.map(function(mod) {
          return mod.ModuleCode;
        });
        if (array_of_times.indexOf(time) !== -1 && array_of_codes.indexOf(code) === -1) {
          return false;
        } else {
          array_of_modules.push(module);
        }
      }
    }
    return true;
  }




  // Insert a module to the timetable array. It will insert to the array[day][time]. The day is based on index (Monday = 0, Tuesday = 1 etc), time too (0800 = 0, 0900 = 1 etc).
  function insert_module(module, index) {
    var timetable = module.Timetable[index];
    var time = timetable.Timings;
    for (var i = 0; i < time.length; i++) {
      var current_time_in_mod = time[i];
      var day = current_time_in_mod.DayText;
      var day_index = day_to_num(day);
      var start = parseInt(current_time_in_mod.StartTime);
      var end = parseInt(current_time_in_mod.EndTime);
      for (var j = start; j < end; j += 100) {
        var time_to_index = j / 100 - 8;
        var module_time = timetable_array[day_index][time_to_index];
        module_time.push(module);
      }
    }
  }

  //generates the static timetable - all the slots with just 1 possibility


  function get_random_index(array) {
    return Math.floor(Math.random() * array.length);
  }

  /*** MAIN WORK DONE HERE ***/

  if (!check_clashing_exam(array_of_array_of_mod_objs)) {
    console.log("Exam clash!");
    return false;
  } else {
    //if (calculate_possibilities(array_of_array_of_mod_objs) <= perms_threshold) {
    //  console.log("BRUTEFORCE");
    //} else {

      //Generate static timetable - all references from here
      var static_modules = array_of_array_of_mod_objs.filter(function(mod) {
        return mod["Timetable"].length == 1;
      });

      console.log("static")
      console.log(static_modules);

      //convert static modules into constraints
      constraint_static = [];
      static_modules.forEach(function(mod) {
        timings = mod.Timetable[0].Timings;
        timings.forEach(function(timing) {
            constraint_static.push({"DayText":timing.DayText, "StartTime": timing.StartTime,
                                    "EndTime": timing.EndTime, "Type": timing.Type});
        });

      });

      console.log("Static constraints");
      console.log(constraint_static);
      //given that we have the static constraints, cull the array of array of mod objects.
      cullHardConstraints(constraint_static, array_of_array_of_mod_objs);
      console.log("re-constrained mods");
      console.log(array_of_array_of_mod_objs);

      /*** IMPT CODE COMMENTED OUT ***/ /*

      for (var i = 0; i < array_of_array_of_mod_objs.length; i++) {
        // insert modules in random position. After that, shuffle
        var timing = array_of_array_of_mod_objs[i].Timetable;
        insert_module(array_of_array_of_mod_objs[i], get_random_index(timing));
      }

       */ /*** IMPT CODE COMMENTED OUT ***/

      // this is the time where we shuffle them modules!
      //for (var i = 0; timetable_array
    //}
  }
  return timetable_array;
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
