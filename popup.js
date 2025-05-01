document.getElementById("save").addEventListener("click", () => {
    const dailyStudyTime = document.getElementById("dailyStudyTime").value;
    console.log(dailyStudyTime);

    chrome.storage.sync.set(
        { dailyStudyTime: parseInt(dailyStudyTime) },
        function () {
            alert("Settings saved");
        }
    );
});
