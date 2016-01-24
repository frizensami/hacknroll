var currentYear = "2015-2016";

//function from outside that groups by
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




//util function to access get elements
function get(name)
{
	if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
		return decodeURIComponent(name[1]);
}

//creates the api link to get the required module
function buildModuleRequest(year, semester, moduleCode)
{
	return "http://api.nusmods.com/" + year + "/" + semester + "/modules/" + moduleCode + ".json";
}

//util function to remove whitespace
function removeWhitespace(value)
{
	return value.replace(/ /g,'');
}

//recieves timetable - which is an array of slots
//outputs timetable with all self-conflicting slots removed
function removeRedundantWithinModule(timetable) {
	var outputTimetable = [];

	var grouped = groupByModuleCode(timetable);
	console.log(grouped);

}

//builds the required output list of module info to use for computation
function buildComputationList(moduleJsonList)
{
	console.log("Building computation list");
	var computationList = [];

	for (var i = 0; i < moduleJsonList.length; i++)
	{
		var computationListModule = {};

		computationListModule["ModuleCode"] = moduleJsonList[i]["ModuleCode"];


		computationListModule["Timetable"] = moduleJsonList[i]["Timetable"];

		//test group
		//removeRedundantWithinModule(computationListModule["Timetable"]);

		computationListModule["ExamDate"] =  moduleJsonList[i]["ExamDate"];


		computationList.push(computationListModule);
		////console.log(moduleJsonList[i]["Timetable"]);
	}


	//return a list where each entry is a unique module-lessontype combination, e.g. CS2020 Lab, CS2020 Sectional, but
	//the lesson is inside the object
	return splitModulesByLessonType(computationList);
}

function splitModulesByLessonType(computationList) {
	console.log("Splitting modules by their lesson types");
	var newComputationList = [];

	computationList.forEach(function(module) {
		//console.log(module);

		//gest the timetable slots split by the lessson type
		var lessonTypes = groupByLessonType(module["Timetable"]);

		//each lessonType is an array of the timetable slots of that lessonType
		lessonTypes.forEach(function(lessonType) {
			newComputationList.push({"ModuleCode": module["ModuleCode"], "Timetable": lessonType, "ExamDate": module["ExamDate"]});
		});

		//newComputationList = newComputationList.concat();
	});
	console.log("new computation list after split");
	console.log(newComputationList);

	console.log("combine same class");
	return combineSameClassNo(newComputationList);
	//return filterRedundantTimeslots(newComputationList);
	//console.log(newComputationList);
}

//given a timetable, changes startime endtime daytext into Times: [{StartTime: Endtime: DayText:}]
function combineSameClassNo(newComputationList) {
	var newerComputationList = [];
	newComputationList.forEach(function(module_with_type) {

		//recives an array of arrays - each array is a list of the slots required of that ClassNo
		var groupedSlots = groupByClassNo(module_with_type["Timetable"]);

		var newSlots = [];

		//for each of the slots grouped by the class number
		groupedSlots.forEach(function(slot_group) {
			//basic new slot
			var newSlot = {"ClassNo": slot_group[0]["ClassNo"],
				"LessonType": slot_group[0]["LessonType"],
				"Venue": slot_group[0]["Venue"],
				"WeekText": slot_group[0]["WeekText"]};

			//base timing array
			var timings = [];

			//for each slot in the group, add their timing to the timing array
			slot_group.forEach(function(slot) {
				timings.push({"DayText": slot["DayText"],
					"StartTime": slot["StartTime"],
					"EndTime": slot["EndTime"]});
			});

			newSlot["Timings"] = timings;
			newSlots.push(newSlot);
		});

		//basic module
		var module_with_type_and_grouped_slots = {"ModuleCode": module_with_type["ModuleCode"],
			"ExamDate": module_with_type["ExamDate"],
			"Timetable": newSlots};
		newerComputationList.push(module_with_type_and_grouped_slots);

		//compute the timetable slot
	});
	console.log("newer comp list");
	console.log(newerComputationList);
	return filterRedundantTimeslots(newerComputationList);
}

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



//check if module has redundant time slots, aka
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

	return newestComputationList;


}


function is_overlapping(x1, x2, y1, y2) {
	//console.log("constraint start - end: " + x1 + " - " + x2);
	//console.log("timing start - end: " + y1 + " - " + y2);
	return Math.max(x1,y1) < Math.min(x2,y2)
}

//singular version of timings fits
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

//given a timing array, check if it fits the constraints provided
function timings_fit_constraints(constraints, timing) {
	//    console.log("Timing");

	var isNotClashes = true;
	constraints.forEach(function(constraint) {
		if ((constraint["Type"] == "Hard") && (!timing_fits_constraint(constraint, timing))) {
			isNotClashes = false;
			//console.log("reject");
			//console.log(constraint);
			//console.log(timing);
			//return false;
		}
	});

	return isNotClashes;
}

//constraint {DayText: "", StartTime: "", EndTime: "", Type: "[hard|soft]", Options: ""}
//returns a new computation list with all modules
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
			newestComputationList["impossible"] = true;
		}

		culledList.push(new_with_baggage);
	});



	//if we find a false inside the array, return false
	if (newestComputationList["impossible"]) {
		throw new Error("Unable to comply with constraints!");
	} else {
		//otherwise return the list
		return culledList;
	}



}


/* BRUTEFORCE FOR STUFF
   overallComputationList = [];

//for each module in the computation list
computationList.forEach(function(module_with_type) {

			//instantiate a final timetable for that module
			finalTimetable = [];

			//for each timetable slot - get all unique by start time
			module_with_type["Timetable"].forEach(function(slot) {
			//check if this particular slot is inside the timetable already
			if (!(insideTimetable(finalTimetable, slot["StartTime"], slot["DayText"], slot["ClassNo"]))) {
			finalTimetable.push(slot);
			}
			});


//add these unique slots to the overall timetable
overallComputationList = overallComputationList.concat({"ModuleCode": module_with_type["ModuleCode"],
"Timetable": finalTimetable,
"ExamDate": module_with_type["ExamDate"]});

});

console.log("Final tt");
console.log(overallComputationList);
*/
	/*

//get all timetable permutations for a single module (w timetable, modulecode & examdate)
//assumption --> no multiple timetable so no need to permutate that
function buildTimetablePermutationsForModule(module)
{
//first step: split module timetable dictionary into a list of lists of dicts
//have a internal list of all lesson types in the current module
// List 1 - first lesson type: [
var timetable = module["Timetable"];
var currentLessonType = timetable[0]["LessonType"]; //We assume that the timetable lesson types are in order, all of X type first, then Y type next, no mixing. Put the current lesson type as the first one to stop edge cases
var overallLessonTypeModList = [];
var currentLessonTypeModList = [];
var currentClassNumber = "" //group class number timeslots w same timetable lessontype together
for (var i = 0; i < timetable.length; i++)
{
timetable[i]["ModuleCode"] = module["ModuleCode"];
timetable[i]["ExamDate"] = module["ExamDate"];

if (timetable[i]["LessonType"] != currentLessonType)
{
		//reset the current lesson type and push the timetable list to the overall list
		currentLessonType = timetable[i]["LessonType"];
		overallLessonTypeModList.push(currentLessonTypeModList);

		//clear and push first mod of new type
		currentLessonTypeModList = [];
		currentLessonTypeModList.push(timetable[i]);

	//clear the class number as we have gone over to a new lesson type
	currentClassNumber = "";
	}
	else
	{
		//if the objects are of the same lesson type, and their class numbers are the same, they have to be taken tgt.
		//Therefore check if the current and prev class nums are the same, if so, take the last element, make it an array if necessary
		//and append the current timetable slot thing to that element
		var thisClassNumber = timetable[i]["ClassNo"];
		if (currentClassNumber != thisClassNumber)
		{
		currentLessonTypeModList.push(timetable[i]);
		currentClassNumber = thisClassNumber;
		}
		else
		{
		var lastElement = currentLessonTypeModList[currentLessonTypeModList.length - 1];

	//check if it already was an array - basically if we have added stuff to it before
	if (Object.prototype.toString.call(lastElement) === '[object Array]')
	{
			//ok object is an array, we can just append
			currentLessonTypeModList[currentLessonTypeModList.length - 1].push(timetable[i]);

			}
			else //not already an array, we have to make an array in the last element and add
			{
			var newArray = [];
			newArray.push(currentLessonTypeModList[currentLessonTypeModList.length - 1]); //push last element
			newArray.push(timetable[i]); //push newest timetable slot

			currentLessonTypeModList[currentLessonTypeModList.length - 1] = newArray; //replace last element w array

			}
			}
			}
			}
	//last push for modules that haven't been added
	overallLessonTypeModList.push(currentLessonTypeModList);


	//logging
	console.log("Overall LessonType Mod List for Module " + module["ModuleCode"] + ": ");
	console.log(overallLessonTypeModList);

	//permutate all possible combinations within the module

	var allPermutations = cartesian.apply(this, overallLessonTypeModList);
	//console.log("All permutations: ");
	//console.log(allPermutations);



	return allPermutations;
	}

//helper function from stackOf to permutate an array of arrays
function cartesian() {
	var r = [], arg = arguments, max = arg.length-1;

	////console.log("Cartesian Arguments: ");
	////console.log(arg);

	function helper(arr, i){
		for (var j=0, l=arg[i].length; j<l; j++) {
			var a = arr.slice(0); // clone arr
			a.push(arg[i][j]);
			if (i==max)
				r.push(a);
			else
				helper(a, i+1);
		}
	}
	helper([], 0);
	return r;
}

//non recursive array flattener
function flatten(array, mutable) {
	var toString = Object.prototype.toString;
	var arrayTypeStr = '[object Array]';

	var result = [];
	var nodes = (mutable && array) || array.slice();
	var node;

	if (!array.length) {
		return result;
	}

	node = nodes.pop();

	do {
		if (toString.call(node) === arrayTypeStr) {
			nodes.push.apply(nodes, node);
		} else {
			result.push(node);
		}
	} while (nodes.length && (node = nodes.pop()) !== undefined);

	result.reverse(); // we reverse result to restore the original order
	return result;
}

function eliminateIntermediates(intermediate)
{
	//TODO: add exam date clash

	var workingCopy = intermediate;
	var numClash = 0;
	console.log("Incoming Length: " + workingCopy.length);
	for (var i = 0; i < workingCopy.length; i++)
	{
		var tbClash = CheckTimetableClash(flatten(workingCopy[i]));
		// console.log("Flattened copy for analysis: ")
		// console.log(flatten(workingCopy[i]));
		if (tbClash == true)
		{
			workingCopy.splice(i, 1);
			i--;

			numClash++;
		}
		else
		{
			//TODO!
			//       var examClash = CheckExamDates(flatten
		}


	}
	console.log("Outgoing length: " + workingCopy.length);
	console.log("Number of clashes: ");
	console.log(numClash);
	return workingCopy;
}

//generate a list of all possible timetable configurations given the input list to be used for computation
function buildTimetablePermutationList(computationList)
{
	var timetablePermutationList = [];

	for (var i = 0; i < computationList.length; i++)
	{
		var permutationList = buildTimetablePermutationsForModule(computationList[i]);
		timetablePermutationList.push(permutationList);
	}
	//console.log("TIMETABLE PERMUTATIONS LIST: ");
	//console.log(timetablePermutationList);

	//permutate all
	var intermediate = [];

	for (var i = 0; i < timetablePermutationList.length - 1; i++)
	{
		if (i == 0)
		{
			var intermediate  = cartesian.apply(this, timetablePermutationList.slice(0, 2));
		}
		else
		{
			var intermediate = cartesian(intermediate, timetablePermutationList[i+1]);
		}


		//console.log("Flattened | Unflattened");


		//console.log(flatten(intermediate), intermediate);


		intermediate = eliminateIntermediates(intermediate);

		//console.log("Intermediate after flatten and removal: ");
		//console.log(intermediate);
	}

	//intermediate = cartesian.apply(this, timetablePermutationList);
	var allModulesPermutations = intermediate;
	//console.log("All calculated permutations: ");
	//console.log(allModulesPermutations);

	return allModulesPermutations;


}
*/
//---------------------------MAIN START-----------------------//


function main(iYear, iSemester, iModules, iConstraint) {

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

			var computationList = buildComputationList(moduleJsonList);
			console.log("Computation List: ");
			console.log(computationList);

			console.log("constraints");
			console.log(constraints);

			console.log("With constraints");
			var culledList = cullHardConstraints(constraints, computationList)
				console.log(culledList);

			//constraints loose enoug
			if (culledList != false) {
				console.log("permutations");
				console.log(culledList.map(function(x) { return x["Timetable"].length }).reduce(function(prev, cur) {
					return prev * cur;}));

				console.log("producing timetable");
				console.log(produce_timetable(culledList));
			} else {
				console.log("Error! Constraints too tight.")
					throw new Error("Constraints too tight");
			}






			//console.log("Culled List 1400-1600: "); - USE 1010 SEM2 TO TEST
			//console.log(cullHardConstraints([{"StartTime": "1400", "EndTime": "1600", "Type": "Hard"}],
			//            computationList));
			//carry on with rest of program
			//this is the new main executing point

			//Commenting out to try worker approach
			//var timetablePermutationList = buildTimetablePermutationList(computationList);
			/*
			   var ttplWorker = new Worker('/buildttpl');
			   ttplWorker.addEventListener('message', function(e){
			   console.log("From ttplWorker, final permutation list: ");
			   console.log(e.data);

			   console.log("PROGRAM HAS ENDED!");
			   },false);
			   ttplWorker.postMessage(computationList);
			   */
			/* Final pass during testing
			   console.log("Final countdown");
			   var someshit = eliminateIntermediates(timetablePermutationList);
			   console.log(someshit);
			   */

		}
	},1);

	//-------------------MAIN END-------------------------------//


	/*
	   var url = "http://api.nusmods.com/2014-2015/2/modules/FE5218.json";
		//console.log("Attempting retrieval of module data");
		request({
		url: url,
		json: true
		}, function (error, response, body) {

		if (!error && response.statusCode === 200) {
			//console.log(body) // Print the json response
			}
			});
			*/



}
