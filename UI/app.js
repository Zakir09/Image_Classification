Dropzone.autoDiscover = false;

function init() {
    let players = []; // Array to store player names dynamically.

    // Load the class_dictionary.json file.
    $.getJSON("./class_dictionary.json", function (data) {
        players = Object.keys(data); // Extract player names from the JSON file.
        console.log("Loaded players:", players); // Debugging, check if players are loaded.
    });

    let dz = new Dropzone("#dropzone", {
        url: "/",
        maxFiles: 1,
        addRemoveLinks: true,
        dictDefaultMessage: "Some Message",
        autoProcessQueue: false
    });

    dz.on("addedfile", function() {
        if (dz.files[1] != null) {
            dz.removeFile(dz.files[0]);
        }
    });

    dz.on("complete", function(file) {
        var url = "http://127.0.0.1:5000/classify_image";

        $.post(url, {
            image_data: file.dataURL
        }, function(data, status) {
            console.log(data);

            if (!data || Object.keys(data).length === 0) {
                console.log("No face detected, showing error message."); // Debugging
                $("#resultHolder").hide();
                $("#divClassTable").hide();
                $("#error").removeClass("d-none").show(); // Ensure it's visible
                return;
            }
            

            let topResults = []; // Array to store the top 3 results.

            data.forEach(item => {
                let probabilities = item.class_probability;
                let classDictionary = item.class_dictionary;

                // Map player names with their probabilities.
                let playerScores = Object.keys(classDictionary).map(playerName => {
                    return {
                        player: playerName,
                        score: probabilities[classDictionary[playerName]]
                    };
                });

                // Sort by score in descending order.
                playerScores.sort((a, b) => b.score - a.score);

                // Take the top 3 results.
                topResults.push(...playerScores.slice(0, 3));
            });

            // Sort all top results across detected faces.
            topResults.sort((a, b) => b.score - a.score);

            // Display the top 3 results overall.
            $("#error").hide();
            $("#resultHolder").show();

            // Clear the cards first.
            $("#predictionCards").html("");

            // Add top 3 cards to the results section.
            topResults.slice(0, 3).forEach(result => {
                let playerName = result.player;
                let playerImage = `./images/${playerName.replace(/ /g, '_').toLowerCase()}.jpg`; // Assuming images are named after players

                let card = `
                    <div class="col-12 col-md-4">
                        <div class="card prediction-card">
                            <img src="${playerImage}" class="card-img-top" alt="${playerName}">
                            <div class="prediction-card-body">
                                <h5 class="card-title">${playerName}</h5>
                                <p class="card-text">Probability: ${result.score.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                `;
                $("#predictionCards").append(card);
            });
        });
    });

    $("#submitBtn").on('click', function(e) {
        dz.processQueue();
    });
}

$(document).ready(function() {
    console.log("ready!");
    $("#error").hide();
    $("#resultHolder").hide();

    init();
});
