(function () {
  if (!window.location.href.includes("udemy.com/course/")) {
    console.log("Not a Udemy course page. Exiting.");
    return;
  }

  function insertButton() {
    const header = document.querySelector(".header--header-title--JssxM");
    if (!header) {
      console.log("Header not found. Retrying...");
      setTimeout(insertButton, 1000); // Retry if the header is not loaded yet
      return;
    }

    // Check if the button already exists to prevent duplicates
    if (document.getElementById("schedule-course-button")) {
      console.log("Button already exists. Exiting.");
      return;
    }

    // Create the button
    const button = document.createElement("button");
    button.innerText = "Schedule Course";
    button.id = "schedule-course-button";
    button.style.marginLeft = "10px";
    button.style.padding = "8px 12px";
    button.style.background = "#f15400";
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";

    // Add click event
    button.addEventListener("click", () => {
      console.log("Button clicked. Extracting video durations...");
      const durations = getVideoDurations();
      console.log("Video durations:", durations);
      chrome.storage.sync.get({ dailyStudyTime: 60 }, function (data) {
        console.log("Daily study time:", data.dailyStudyTime);
        const schedule = calculateSchedule(durations, data.dailyStudyTime);
        console.log("Schedule:", schedule);
        displayDueDates(schedule);
      });
    });

    header.appendChild(button);
    console.log("Button inserted successfully.");
  }

  function getVideoDurations() {
    const videoMetadataElements = document.querySelectorAll(
      ".curriculum-item-link--metadata--XK804"
    );
    console.log("Video metadata elements found:", videoMetadataElements.length);
    const durations = Array.from(videoMetadataElements).map((el) => {
      const timeText = el.querySelector("span").innerText.trim();
      console.log("Time text:", timeText);
      return convertTimeToSeconds(timeText);
    });
    return durations;
  }

  function convertTimeToSeconds(timeText) {
    let totalSeconds = 0;

    if (timeText.includes("h")) {
      const hours = parseInt(timeText.split("h")[0].trim(), 10);
      totalSeconds += hours * 3600;
      timeText = timeText.split("h")[1].trim();
    }

    if (timeText.includes("min")) {
      const minutes = parseInt(timeText.split("min")[0].trim(), 10);
      totalSeconds += minutes * 60;
    }

    console.log("Converted time to seconds:", totalSeconds);
    return totalSeconds;
  }

  function calculateSchedule(durations, dailyStudyTime) {
    let schedule = [];
    let currentDate = new Date();
    let remainingTime = dailyStudyTime * 60;

    durations.forEach((duration) => {
      if (remainingTime < duration) {
        currentDate.setDate(currentDate.getDate() + 1);
        remainingTime = dailyStudyTime * 60;
      }
      schedule.push(new Date(currentDate));
      remainingTime -= duration;
    });

    return schedule;
  }

  function displayDueDates(schedule) {
    const videoElements = document.querySelectorAll(
      ".curriculum-item-link--bottom-row--AVBnl"
    );
    console.log("Video elements found:", videoElements.length);
    videoElements.forEach((el, index) => {
      const dueDate = schedule[index];
      const dueDateElement = document.createElement("h6");
      dueDateElement.innerText = `Due: ${dueDate.toLocaleDateString()}`;
      dueDateElement.style.color = "#f15400";
      dueDateElement.style.fontSize = "1.2rem";
      dueDateElement.style.marginLeft = "10px";
      el.appendChild(dueDateElement);
    });
    console.log("Due dates displayed.");
  }

  insertButton();
})();
