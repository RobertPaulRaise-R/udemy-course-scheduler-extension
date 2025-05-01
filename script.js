// Helper function to get the course slug from the URL
function getCourseSlug(url) {
  try {
    const urlParts = new URL(url);
    const pathnameParts = urlParts.pathname.split('/');
    const courseIndex = pathnameParts.indexOf('course');
    const learnIndex = pathnameParts.indexOf('learn');

    if (courseIndex !== -1 && learnIndex > courseIndex + 1) {
      return pathnameParts[courseIndex + 1];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error parsing URL:", error);
    return null;
  }
}

// Helper function to convert time string to seconds
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

// Helper function to get video durations, excluding completed videos
function getVideoDurations() {
  const videoMetadataElements = document.querySelectorAll(
    ".curriculum-item-link--metadata--XK804"
  );
  console.log("Video metadata elements found:", videoMetadataElements.length);
  const durations = Array.from(videoMetadataElements)
    .filter((el) => {
      const curriculumItem = el.closest('[data-purpose^="curriculum-item-"]');
      if (curriculumItem) {
        const checkedInput = curriculumItem.querySelector('input[type="checkbox"][data-purpose="progress-toggle-button"][checked]');
        return !checkedInput;
      }
      return true;
    })
    .map((el) => {
      const spanElement = el.querySelector("span");
      if (spanElement) {
        const timeText = spanElement.innerText.trim();
        console.log("Time text (not watched):", timeText);
        return convertTimeToSeconds(timeText);
      } else {
        console.log("Span element not found within metadata (not watched).");
        return 0;
      }
    });
  return durations;
}

// Helper function to calculate the schedule
function calculateSchedule(durations, dailyStudyTime) {
  let schedule = [];
  let currentDate = new Date();
  let remainingTime = dailyStudyTime * 60;

  durations.forEach((duration) => {
    if (remainingTime < duration) {
      currentDate.setDate(currentDate.getDate() + 1);
      remainingTime = dailyStudyTime * 60;
    }
    schedule.push(new Date(currentDate).toISOString()); // Store as ISO string
    remainingTime -= duration;
  });
  return schedule;
}

// Helper function to display due dates
function displayDueDates(schedule) {
  const videoElements = document.querySelectorAll(
    ".curriculum-item-link--bottom-row--AVBnl"
  );
  console.log(videoElements);

  let scheduleIndex = 0;

  if (videoElements.length > 0) {
    console.log("Video elements found:", videoElements.length);
    videoElements.forEach((el) => {
      const curriculumItem = el.closest('[data-purpose^="curriculum-item-"]');
      if (curriculumItem) {
        const checkedInput = curriculumItem.querySelector('input[type="checkbox"][data-purpose="progress-toggle-button"][checked]');
        if (!checkedInput && schedule[scheduleIndex]) {
          const dueDate = new Date(schedule[scheduleIndex]); // Convert from ISO string
          const dueDateElement = document.createElement("div");
          dueDateElement.innerText = `Due: ${dueDate.toLocaleDateString()}`;
          dueDateElement.style.color = "#f15400";
          dueDateElement.style.marginLeft = "10px";
          el.appendChild(dueDateElement);
          console.log(`Due date added for incomplete item (schedule index ${scheduleIndex}): ${dueDate.toLocaleDateString()}`);
          scheduleIndex++;
        } else if (checkedInput) {
          console.log("Skipping completed item.");
        } else if (!schedule[scheduleIndex]) {
          console.log("No more due dates in the schedule for incomplete items.");
        }
      } else {
        console.warn(`Curriculum item not found for element:`, el);
      }
    });
    console.log("Due dates displayed (for incomplete items).");
  }
}

// Helper functions for chrome storage
function saveSchedule(courseSlug, scheduleData) {
  const storageKey = `courseSchedule_${courseSlug}`;
  chrome.storage.local.set({
    [storageKey]: scheduleData
  }, () => {
    console.log(`Schedule saved for ${courseSlug}`);
  });
}

function loadSchedule(courseSlug, callback) {
  const storageKey = `courseSchedule_${courseSlug}`;
  chrome.storage.local.get([storageKey], (result) => {
    const storedSchedule = result[storageKey];
    if (storedSchedule) {
      console.log(`Schedule loaded for ${courseSlug}`, storedSchedule);
      callback(storedSchedule);
    } else {
      console.log(`No schedule found for ${courseSlug}`);
      callback([]);
    }
  });
}

// Function to handle the main logic
function main() {
  if (!window.location.href.includes("udemy.com/course/")) {
    console.log("Not a Udemy course page. Exiting.");
    return;
  }

  const currentCourseSlug = getCourseSlug(window.location.href);

  // Create the Schedule button
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

  // Function to expand all sections and schedule
  function expandAndSchedule() {
    expandAllSections();
    const durations = getVideoDurations();
    const schedule = calculateSchedule(durations, 60); // 60 minutes per day
    saveSchedule(currentCourseSlug, schedule); // Save the schedule
    displayDueDates(schedule);
  }

  // Add click event to the button, only once.
  button.addEventListener("click", expandAndSchedule, {
    once: true
  });

  // Function to insert the button
  function insertButton() {
    const header = document.querySelector(".header--header-title--JssxM");
    if (!header) {
      console.log("Header not found. Retrying...");
      setTimeout(insertButton, 1000);
      return;
    }

    if (document.getElementById("schedule-course-button")) {
      console.log("Button already exists. Exiting.");
      return;
    }

    header.appendChild(button);
    console.log("Button inserted successfully.");
  };

  // Function to expand all sections
  function expandAllSections() {
    const sectionTogglers = document.querySelectorAll('.ud-accordion-panel-toggler');
    sectionTogglers.forEach((toggler) => {
      const panel = toggler.closest('div[data-purpose^="section-panel-"]');
      if (panel) {
        const isExpanded = panel.classList.contains('is-open');
        if (!isExpanded) {
          console.log("Expanding section using toggler:", panel.getAttribute('data-purpose'));
          toggler.click();
        } else {
          console.log("Section already expanded:", panel.getAttribute('data-purpose'));
        }
      }
    });
  }

  // Mutation Observer to handle dynamic content updates
  function observeSidebarChanges() {
    const sidebar = document.querySelector('.course-content-container'); //  selector for the course content container
    if (sidebar) {
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Content has been added, and the button is not there
            if (!document.getElementById("schedule-course-button")) {
              insertButton(); // Re-insert the button
            }
            loadSchedule(currentCourseSlug, (loadedSchedule) => {
              displayDueDates(loadedSchedule);
            });
            break;
          }
        }
      });
      observer.observe(sidebar, {
        childList: true,
        subtree: true
      });
    }
  }

  // Initial insertion and setup.
  insertButton();
  observeSidebarChanges(); // Start observing for changes.

  // Load and display schedule on initial page load
  loadSchedule(currentCourseSlug, (loadedSchedule) => {
    displayDueDates(loadedSchedule);
  });
};

// Run the main function
main();
