var currentYear = "2015-2016";

/*
	Converts an array of elements into subarrays inside the main array based on the
	object access function f.
	For eg, groupBy(arr, function(x) { return x.length} ) would group all the objects inside the array
	by their length.
*/
function groupBy( array , f )
{
	var groups = {};
	array.forEach( function( o )
			{
				var group = JSON.stringify( f(o) );
				groups[group] = groups[group] || [];
				groups[group].push( o );
			});
	return Object.keys(groups).map( function( group )
			{
				return groups[group];
			})
}

/*
	A set of grouping functions that takes the timetable array and groups the items inside by a particular
	attribute
*/
function groupByModuleCode(timetable) {
	return groupBy(timetable, function(item) { return item.ClassNo; });
}

function groupByLessonType(computationListModule) {
	//console.log(computationListModule);
	return groupBy(computationListModule, function(item) { return item.LessonType; });
}

function groupByClassNo(timetable) {
	//console.log(computationListModule);
	return groupBy(timetable, function(item) { return item.ClassNo; });
}

/*
	Gods help me, a regex function to parse the URL for a particular GET parameter. Taken from SO
*/
function get(name)
{
	if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
		return decodeURIComponent(name[1]);
}

/*
	given a year (requires range e.g. "2015-2016" or "2013-2014"), semester (1-4, 3 and 4 are special terms), and a
	module code (CS2020), returns the nusmods api link for it.
*/
function buildModuleRequest(year, semester, moduleCode)
{
	return "http://api.nusmods.com/" + year + "/" + semester + "/modules/" + moduleCode + ".json";
}

/*
	Utility function to remove whitespace
*/
function removeWhitespace(value)
{
	return value.replace(/ /g,'');
}

/*
	Recieves timetable - which is an array of slots.
	Outputs timetable with all self-conflicting slots removed
*/
function removeRedundantWithinModule(timetable) {
	var outputTimetable = [];

	var grouped = groupByModuleCode(timetable);
	console.log("Grouped: ")
	console.log(grouped);

}

/* Unused but could be a useful util function */
function insideTimetable(timetable, timing, day, classNo) {
	for (var i = 0; i < timetable.length; i++) {
		if (timetable[i]["StartTime"] == timing &&
				timetable[i]["DayText"] == day &&
				timetable[i]["ClassNo"] != classNo) {
			//^^^^ make sure we don't return true if they're same class number, because they have to be taken together!
			return true;
		}
	}

	return false;
}
/*
	Checks the whole timetable for clashes, use pseudoscience to see if we have a tolerable number
	of clashes
*/
function no_clashes_found(timetable, slot) {
	//console.log("timetable");
	//console.log(timetable

	//check through whole timetable
	for (var i = 0; i < timetable.length; i++) {
		//each timetable item has timings
		var timings = timetable[i]["Timings"];

		//use this to keep track of how many clashes we get. Super pseudo science. No more than the num of timings.
		var clashes = 0;

		//check that for each of the timings of that slot in the timetable
		for (var j = 0; j < timings.length; j++) {
			for (var k = 0; k < slot["Timings"].length; k++) {
				if (timings[j]["StartTime"] == slot["Timings"][k]["StartTime"] &&
						timings[j]["DayText"] == slot["Timings"][k]["DayText"] &&
						timings[j]["ClassNo"] == slot["Timings"][k]["ClassNo"]) {

					//increase number of clashes, later check if > timings.lenth
					clashes += 1;
				}
			}
		}
		if (clashes >= timings.length) { return false; } //we have enough clashes to call this slot redundant
	}

	return true;
}



/*
	===== MAIN COMPUTATION BEGINS HERE =====
	Main entry point for computation. Extracts only relevant information from raw module data and
	passes it to another function to split the modules by lesson type.
*/

function buildComputationList(moduleJsonList)
{
	console.log("Building computation list");
	var computationList = [];

	for (var i = 0; i < moduleJsonList.length; i++)
	{
		var computationListModule = {};
		computationListModule["ModuleCode"] = moduleJsonList[i]["ModuleCode"];
		computationListModule["Timetable"] = moduleJsonList[i]["Timetable"];
		computationListModule["ExamDate"] =  moduleJsonList[i]["ExamDate"];

		computationList.push(computationListModule);
		////console.log(moduleJsonList[i]["Timetable"]);
	}


	//return a list where each entry is a unique module-lessontype combination, e.g. CS2020 Lab, CS2020 Recitation, but
	//the lesson is inside the object
	return splitModulesByLessonType(computationList);
}

/*
	Takes in a list of modules that have only the relevant info (module code, timetable, exam date)
	and takes out modules from the list that have the same module code but different lesson types. E.g.
	CS2020 lab and CS2020 recitation are considered separate "modules" by the system.
	Passes result to another function to combine classes of the same ClassNo together (as they're meant to be taken together)
*/
function splitModulesByLessonType(computationList) {
	console.log("Splitting modules by their lesson types");
	// empty holder since we don't want to modify the computation list
	var newComputationList = [];
	// loop through the incoming computation list
	// we want to output a module list that is grouped by lesson types
	computationList.forEach(function(module) {

		//gest the timetable slots split by the lessson type
		var lessonTypes = groupByLessonType(module["Timetable"]);

		// each lessonType is an array of the timetable slots of that lessonType
		// we push it into the output array
		lessonTypes.forEach(function(lessonType) {
			newComputationList.push({"ModuleCode": module["ModuleCode"], "Timetable": lessonType, "ExamDate": module["ExamDate"]});
		});

		//newComputationList = newComputationList.concat();
	});
	console.log("After split into lesson types");
	console.log(newComputationList);

	console.log("Combining by class");
	// pass the module list into another functin that combines classes with the same class number together
	// since these modules are meant to be taken together, makes sense for them to be a logical unit
	return combineSameClassNo(newComputationList);

}
/*
	Group the incoming lesson-type-split timetable by their class numbers, and return them as one logical
	object unit so that we can operate on them together later.
	Major modification of time data occurs here:
		starttime, endtime, daytext attributes are changes into an
		array of times because we now have to accomodate more modules.
		Specifically, combined into the Times sub-object - Times: [{StartTime: Endtime: DayText:}]
		an array of starttimes, endtimes and daytexts.

	Results passed to another function to remove redundant timeslots (e.g from this point on,
	two classes that are at the same time but different places become one class).
*/

function combineSameClassNo(newComputationList) {
	var newerComputationList = [];
	newComputationList.forEach(function(module_with_type) {

		// recives an array of arrays - each array is a list of the slots required of that ClassNo
		var groupedSlots = groupByClassNo(module_with_type["Timetable"]);

		var newSlots = [];

		// for each of the slots grouped by the class number
		groupedSlots.forEach(function(slot_group) {
			// basic new slot
			var newSlot = {"ClassNo": slot_group[0]["ClassNo"],
				"LessonType": slot_group[0]["LessonType"],
				"Venue": slot_group[0]["Venue"],
				"WeekText": slot_group[0]["WeekText"]};

			// base timing array
			var timings = [];

			// for each slot in the group, add their timing to the timing array
			slot_group.forEach(function(slot) {
				timings.push({"DayText": slot["DayText"],
					"StartTime": slot["StartTime"],
					"EndTime": slot["EndTime"]});
			});

			newSlot["Timings"] = timings;
			newSlots.push(newSlot);
		});

		// basic module
		var module_with_type_and_grouped_slots = {"ModuleCode": module_with_type["ModuleCode"],
			"ExamDate": module_with_type["ExamDate"],
			"Timetable": newSlots};
		newerComputationList.push(module_with_type_and_grouped_slots);

	});
	console.log("newer comp list");
	console.log(newerComputationList);

	// remove any redundant slots from the timetable list
	return filterRedundantTimeslots(newerComputationList);
}



/*
	Take out timeslots that are exactly the same except for the location
*/
function filterRedundantTimeslots(newerComputationList) {

	var newestComputationList = [];

	//foreach module in the computation list
	newerComputationList.forEach(function(module_with_baggage) {
		no_clash_timetable = [];

		//get the timetable for each module
		module_with_baggage["Timetable"].forEach(function(slot) {
			if (no_clashes_found(no_clash_timetable, slot)) {
				no_clash_timetable.push(slot);
			}
		});

		//console.log("no clash tb");
		//console.log(no_clash_timetable);
		var new_module_with_baggage = {"ModuleCode": module_with_baggage["ModuleCode"],
			"ExamDate": module_with_baggage["ExamDate"],
			"Timetable": no_clash_timetable};
		newestComputationList.push(new_module_with_baggage);
	});

	console.log("Newest computation list");
	console.log(newestComputationList);

	// finally returns this computation list, fully filtered, grouped and ordered.
	return newestComputationList;


}

/* SET OF IMPORTANT UTILITY FUNCTIONS FOR CONSTRAINT DETECTION AND MODULE REMOVAL BASED ON CONSTRAINTS */

/*
	pure function that checks whether (x1, x2) overlaps with (y1, y2)
*/
function is_overlapping(x1, x2, y1, y2) {
	//console.log("constraint start - end: " + x1 + " - " + x2);
	//console.log("timing start - end: " + y1 + " - " + y2);
	return Math.max(x1,y1) < Math.min(x2,y2)
}

/*
	checks if the incoming timings overlap with any of the contraints specified
*/
function timing_fits_constraint(constraint, timing) {
	var isNotClash = true;
	timing.forEach(function(timing_slot) {
		if (is_overlapping(constraint["StartTime"], constraint["EndTime"], timing_slot["StartTime"], timing_slot["EndTime"])
				&&
				(constraint["DayText"] == undefined || (constraint["DayText"] == timing_slot["DayText"]))
		   ) {
			isNotClash = false;
			//return false;
		}
	});

	return isNotClash;
}

/*
	given a timing array, check if it ALL fits the constraints provided
*/
function timings_fit_constraints(constraints, timing) {
	//    console.log("Timing");

	var isNotClashes = true;
	constraints.forEach(function(constraint) {
		if ((constraint["Type"] == "Hard") && (!timing_fits_constraint(constraint, timing))) {
			isNotClashes = false;
		}
	});

	return isNotClashes;
}

/*
	Returns a new computation list with all modules
	constraint format: {DayText: "", StartTime: "", EndTime: "", Type: "[hard|soft]", Options: ""}
	Pass in an array of such to cull anything that doesn't fit those from the newestcomputationlist.
*/
function cullHardConstraints(constraints, newestComputationList) {
	var culledList = [];

	newestComputationList.forEach(function(module_with_baggage) {
		var new_with_baggage = {};
		new_with_baggage["Timetable"] = module_with_baggage["Timetable"].
			filter(function(slot) {
				return timings_fit_constraints(constraints, slot["Timings"]);
			});
		new_with_baggage["ExamDate"] = module_with_baggage["ExamDate"];
		new_with_baggage["ModuleCode"] = module_with_baggage["ModuleCode"];
		//if this module has 0 possible slots with hard constraints, this setup is impossibru
		if (new_with_baggage["Timetable"].length <= 0) {
			culledList["impossible"] = true;
		}
		culledList.push(new_with_baggage);
	});

    //if we find a false inside the array, return false
    if (culledList["impossible"]) {
        console.log("constraints");
        console.log(constraints);
        //alert("Unable to comply with constraints!");
        throw new Error("Unable to comply with constraints!");
    } else {
        //otherwise return the list
        return culledList;
    }

}

/*
	Helper function (Herbert) that returns if the array of timeslots have any clashes with each other.
*/
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

/*
	Converts the class type from string form to URL form
*/
function toComplexClassType(str) {
	switch(str) {
		case "Lecture":
			return "[LEC]";
		case "Seminar-Style Module Class":
			return "[SEM]";
		case "Tutorial":
			return "[TUT]";
		case "Laboratory":
			return "[LAB]";
		case "Sectional Teaching":
			return "[SEC]";
		case "Recitation":
			return "[REC]";
		case "Packaged Lecture":
			return "[PLEC]";
		case "Packaged Tutorial":
			return "[PTUT]";
		default:
			alert("Class type not recognized: " + str)
			break;

	}
}



//---------------------------MAIN START-----------------------//




function mainF(iYear, iSemester, iModules, iConstraint, iPacked) {

	//use get request function from above to access get request header
	var year = iYear || get('year');
	var semester =iSemester || get('semester');
	var modules = iModules || get('modules');
	var constraints = iConstraint || [];


	//check for missing get info
	if (semester == null || modules == null)
	{
		throw new Error("Either semester info or module info is missing!");
	}

	//set year to current if no year present in get
	if (year == null)
	{
		year = currentYear;
		//console.log("Year corrected");
	}

	//console.log("Year: " + year + " Sem: " + semester + " Mods: " + modules);

	//split modules by comma delim and convert to uppercase as required
	var moduleList = removeWhitespace(modules).toUpperCase().split(",");
	//console.log("Module List: " + moduleList);

	var moduleJsonList = [];

	//build the list containing json info for all modules selected
	//using jquery
	$.each(moduleList, function(i, item){

		var moduleRequest = buildModuleRequest(year, semester, moduleList[i]);
		//console.log("Module Request: " + moduleRequest);
		$.getJSON(moduleRequest, function(data){
			moduleJsonList.push(data);
			////console.log(moduleJsonList);

		});
		////console.log(buildModuleRequest(year, semester, moduleList[i]));

	});


	//run a function often to check for completion of json retrieval. Deregister it if done.
	completionChecker = setInterval(function(){
		//check if all modules are loaded
		if (moduleJsonList.length == moduleList.length)
		{
			window.clearInterval(completionChecker);

            //generate the optimised computation list
			var computationList = buildComputationList(moduleJsonList);
			console.log("Computation List: ");
			console.log(computationList);

            //output incoming constraints from user
			console.log("constraints");
			console.log(constraints); //start time, end time, lunch time constraints



            //check for clash
            if (!check_clashing_exam(computationList)) {
                console.log("Exam clash!");
                return false;
            } else {

                //intial cull of the list - CATCH ERROR
                initialCull = cullHardConstraints(constraints, computationList);

                console.log("initial permutations");
                    console.log(initialCull.map(function(x) { return x["Timetable"].length }).reduce(function(prev, cur) {
                        return prev * cur;}));

                var static_modules = initialCull.filter(function(mod) {
                    return mod["Timetable"].length == 1;
                });


                var while_static_modules = static_modules.map(function(x) { return x; });
                //dynamic modules to apply to
                var dynamic_modules = initialCull.filter(function(mod) {
                    return mod["Timetable"].length > 1;
                });

                while (while_static_modules.length > 0) {
                    console.log("WE ARE LOOP");
                    iterConstraints = [];

                    //GENERATE STATIC CONSTRAINTS - push to constraints array
                    while_static_modules.forEach(function(mod) {
                        timings = mod.Timetable[0].Timings;
                        timings.forEach(function(timing) {
                          iterConstraints.push({"DayText":timing.DayText, "StartTime": timing.StartTime,
                                "EndTime": timing.EndTime, "Type": "Hard"});
                        });

                    });



                    //given that we have the static constraints, cull the array of array of mod objects.
                    culled_arr_arr = cullHardConstraints(iterConstraints, dynamic_modules);

                    console.log("re-constrained mods pass");
                    console.log(culled_arr_arr);
                    //calculate the new problem size
                    console.log("new culled permutations pass");
                    console.log(culled_arr_arr.map(function(x) { return x["Timetable"].length }).reduce(function(prev, cur) {
                        return prev * cur;}));

                    while_static_modules = culled_arr_arr.filter(function(mod) {
                        return mod["Timetable"].length == 1;
                    });

                    static_modules = static_modules.concat(while_static_modules);

                    dynamic_modules = culled_arr_arr.filter(function(mod) {
                        return mod["Timetable"].length > 1;
                    });


                }

                console.log("Static modules")
                console.log(static_modules);
                console.log("Dynamic modules")
                console.log(dynamic_modules);

                //full static passes -- LAST STOP BEFORE TRYING OPTIMIZATIONS
                var all_mods_after_pass = static_modules.concat(dynamic_modules);

                //give all timings a module code
                all_mods_after_pass.forEach(function(mod) {
                	mod.Timetable.forEach(function(timeSlot) {
                		timeSlot["ModuleCode"] = mod["ModuleCode"];
                	})
                });

                //array of timetable strings
                var result_locations = [];

                // RUN HERBERT MAGIC
                var final_mods = produce_timetable(all_mods_after_pass, iPacked);
								console.log("Modules:")
                console.log(final_mods);

                var query_string = "?";
               	for (var i = 0; i < final_mods.length; i++) {
               		query_string += final_mods[i]["ModuleCode"] +
               										toComplexClassType(final_mods[i]["LessonType"]) +
               										"=" +
               										final_mods[i]["ClassNo"] + "&";


               	}

               	var general_timetable = [location.protocol, '//', location.host, location.pathname].join('') + query_string
               	console.log(general_timetable);
               	result_locations.push(general_timetable);


               	  //try free day slots - with full list, not anything else
                days.forEach(function(day) {
                    console.log("Trying " + day);
                    day_constraint = [{"StartTime": "0800", "EndTime": "2359", "Type": "Hard", "DayText": day}]
                    try {
                        day_culled = cullHardConstraints(day_constraint, all_mods_after_pass);
                        console.log("new day_culled permutations");
                        console.log(day_culled.map(function(x) { return x["Timetable"].length }).reduce(function(prev, cur) {
                            return prev * cur;}));

                        var final_mods_day = produce_timetable(day_culled, iPacked);
                        var query_string = "?";
				               	for (var i = 0; i < final_mods_day.length; i++) {
				               		query_string += final_mods_day[i]["ModuleCode"] +
				               										toComplexClassType(final_mods_day[i]["LessonType"]) +
				               										"=" +
				               										final_mods_day[i]["ClassNo"] + "&";


				               	}
				               	var spec_timetable = [location.protocol, '//', location.host, location.pathname].join('') + query_string
				               	console.log(spec_timetable);
				               	result_locations.push(spec_timetable);

                    } catch(e) {
                        console.log("Error, " + day + " as free day not possible");
                    }

                });

								console.log("result locations");
								console.log(result_locations);
								var timetables_arr = result_locations;

               	if (timetables_arr.length == 0) {
               		;
						    } else {
						      var resp_html = "<p style='text-align: center'>Suggested Timetable</p>";
						      for (var i = 0; i < Math.min(3, timetables_arr.length); i++) {
						        var string_to_append = "<p style='text-align: center'><a href='" + timetables_arr[i] + "'>Timetable " + (i + 1) + "</a></p>";
						        resp_html = resp_html + string_to_append;
						      }
						      $('.timetable_result').html(resp_html);
						    }



		  }
        }
	},1);

	//-------------------MAIN END-------------------------------//




}
