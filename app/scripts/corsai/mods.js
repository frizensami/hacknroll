// Variables
var reject = false

var TimeSlots = [{name: "Timeslot6", DayText: "Monday", StartTime: "0000", EndTime: "0200", WeekText:"Every Week"},
        {name: "Timeslot6", DayText: "Tuesday", StartTime: "0000", EndTime: "0200", WeekText:"Every Week"},
        {name: "Timeslot1", DayText: "Wednesday", StartTime: "0000", EndTime: "0200", WeekText:"Every Week"},
        {name: "Timeslot2", DayText: "Wednesday", StartTime: "0400", EndTime: "0600", WeekText:"Every Week"},
        {name: "Timeslot3", DayText: "Wednesday", StartTime: "0600", EndTime: "0800", WeekText:"Every Week"},
        {name: "Timeslot4", DayText: "Wednesday", StartTime: "0800", EndTime: "0900", WeekText:"Odd Week"},
        {name: "Timeslot5", DayText: "Wednesday", StartTime: "0900", EndTime: "1000", WeekText:"Even Week"},
        {name: "Timeslot5", DayText: "Thursday", StartTime: "0000", EndTime: "0200", WeekText:"Every Week"},
        {name: "Timeslot7", DayText: "Friday", StartTime: "0000", EndTime: "0200", WeekText:"Every Week"}
        ]
// Take note of the function checkExamDate which requires the dictionary within examDates to be "examDate"
var ExamDates = [{module: "CS1101S", ExamDate: "2015-11-26T17:00+0800"},
        {module: "CS1231", ExamDate: "2015-11-25T17:00+0800"},
        {module: "UTW1001R"},
        {module: "MA1521", ExamDate: "2015-12-01T09:00+0800"},
        {module: "MA1521", ExamDate: "2015-13-01T09:00+0800"},
        {module: "GEM1001"}]

// Function to check if a string is found within an array
// Returns True if needle is found within the haystack and False if it is not found
function WithinArray(needle, arrhaystack) {
  return (arrhaystack.indexOf(needle) > -1);
}

// Function to check the list "ExamDates" and make sure the exam dates do not clash
// Looping through each date within ExamDates to make sure the Dates don't clash and if the dates do clash, make sure the timings are at least 3h apart.
// Return False if there are no clashes, and True if there are clashes
function CheckExamDates(ExamDates) {
  // NoExamIndex stores the Index of the modules within ExamDates that do not have any exam dates
  var NoExamIndex = []
  for (var i = 0; i < ExamDates.length; i++)
  {
    if (typeof ExamDates[i]["ExamDate"] == 'undefined' || ExamDates[i]["ExamDate"] == "")
    {
      NoExamIndex.push(i);
    }
  }

  // Go through to the first dictionary in ExamDates and check with the rest for clashes. Repeat by moving down ExamDates list.
  for (var i = 0; i < ExamDates.length; i++)
  {
    for (var j = 0; j < ExamDates.length; j++)
    {
      if (j == i || WithinArray(j, NoExamIndex) || WithinArray(i, NoExamIndex))
      {
        continue;
      }
      // Check if the dates clash, just continue if they don't
      // Slice is hard-coded based on the assumption that ExamDates will remain in ISO8601 format
      else if (ExamDates[i]["ExamDate"].slice(0,10) == ExamDates[j]["ExamDate"].slice(0,10))
      {
        // If the dates are the same and if the timings are too close to one another (3 hours)
        if (Math.abs(ExamDates[i]["ExamDate"].slice(11,13) - ExamDates[j]["ExamDate"].slice(11,13)) < 3)
        {
          return true;
        }
      }
    }
  }
  return false
}

// Function to check the list "Timeslots" and make sure the time slots do not clash
// Looping through each TimeSlot and adding to the Timetable dictionary, making sure there are no clashes
// Return False if there are no clashes, and True if there are clashes
function CheckTimetableClash(TimeSlots) {
  // This timetable will take in integers that show times in which there are lessons. If a lesson is from 0800-1000, it will be displayed as
  // [0800, 0900]. 1000 is not included in the timetable because 1000-1100 is free.
  var Timetable = {Monday: [],
          Tuesday: [],
          Wednesday: [],
          Thursday: [],
          Friday: []};
  for (var i = 0; i < TimeSlots.length; i++)
  {
    var TimeToPush = parseInt(TimeSlots[i]["StartTime"])
    // Check if the time to add into the timetable is already within the timetable
    if (WithinArray(TimeToPush, Timetable[TimeSlots[i]["DayText"]]))
    {
// Remember to add in the code that allows you to check if the clashing courses are on Even and Odd weeks
// Note by Sriram: just remembered, this doesn't matter because if it clashes on one week, it's already not viable
      return true;
    }
    else
    {
      while (TimeToPush < parseInt(TimeSlots[i]["EndTime"]))
      {
        Timetable[TimeSlots[i]["DayText"]].push(TimeToPush);
        TimeToPush += 100;
      }
    }
  }
  return Timetable;
}

// Retrieving the timetable from the function "CheckTimeTableClash"
//var Timetable = CheckTimetableClash(TimeSlots);

// Function to give scoring for Free day. It will be 100 if there are any free days and 0 if there are no free days.
// Weight is a range from 0 to 100. It will be multiplied to the score as a percentage.
function ScoreFreeDay (Timetable1, Weight) {
  var Score = 0
  for (var Day in Timetable1)
  {
    if (Timetable1[Day].length == 0)
    {
      Score = 100;
    }
  }
  return Score * Weight / 100;
}

//console.log(CheckExamDates(ExamDates));
//console.log(CheckTimetableClash(TimeSlots));
