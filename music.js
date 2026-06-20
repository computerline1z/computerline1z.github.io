(function () {
    // Playlist array
    var files = [
        "background.mp3"
    ];

    // Current index of the files array
    var i = 0;

    // Get the audio element
    var music_player = document.querySelector("#music_list audio");
    var canvas = document.querySelector("#canvas");
    // function for moving to next audio file
    function next() {
        // Check for last audio file in the playlist
        if (i === files.length - 1) {
            i = 0;
        } else {
            i++;
        }

        // Change the audio element source
        music_player.src = files[i];
    }

    // Check if the player is selected
    if (music_player === null) {
        throw "Playlist Player does not exists ...";
    } else {
        // Start the player
        music_player.src = files[i];

        // Thử autoplay với JS (thay vì chỉ dựa vào attribute)
        function attemptPlay() {
            music_player.play()
                .then(() => {
                    console.log('Autoplay started successfully');
                })
                .catch(error => {
                    if (error.name === 'NotAllowedError') {
                        console.log('Autoplay blocked. Showing manual play button.');
                        // Tạo nút play thủ công (ví dụ: thêm vào DOM)
                        const playButton = document.createElement('button');
                        playButton.textContent = 'Play Music';
                        playButton.onclick = () => {
                            music_player.play();
                            playButton.remove();  // Ẩn nút sau khi click
                        };
                        document.body.appendChild(playButton);  // Hoặc append vào vị trí phù hợp
                    } else {
                        console.error('Error playing audio:', error);
                    }
                });
        }

        // Gọi attemptPlay sau khi src load
        music_player.addEventListener('loadedmetadata', attemptPlay);

        // Listen for the music ended event
        music_player.addEventListener('ended', next, false);
    }
     canvas.onclick = () => {
                            music_player.play();
                        };
})();

