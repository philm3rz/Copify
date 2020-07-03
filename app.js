(function () {
    const ENDPOINT = "https://api.spotify.com/v1/playlists/"
    let hash;

    // Redirect user for auth if not done yet
    if (!hash) authenticate();

    //Let user enter playlist ID, then get playlist info
    document.querySelector('#playlist').addEventListener('change', (event) => {
        playlistID = `${event.target.value}`;
        getPlaylist(playlistID)
        .then(response => {
            //Display name of playlist
            document.querySelector('#playlist-data').innerHTML = `Copy this playlist: ${response.name}`;

            //Display button for starting copy process
            let copy = document.querySelector('#copy')
            copy.style.display = 'block';
            copy.addEventListener('click', () => copyPlaylist(response));
        })

    });

    function authenticate() {
        //Get and print access token
        hash = window.location.hash
            .substring(1)
            .split('&')
            .reduce(function (initial, item) {
                if (item) {
                    var parts = item.split('=');
                    initial[parts[0]] = decodeURIComponent(parts[1]);
                }
                return initial;
            }, {}).access_token;

        //Remove warning if auth was successfull
        if (hash) document.querySelector('#alert').style.display = 'none';
    }

    async function getPlaylist(playlistID) {
        let response = await fetch(`${ENDPOINT}${playlistID}`, {
            headers: {
                'Authorization': 'Bearer ' + hash
            }
        });
        await response.json().then(data => {
            response = data;
        })
        return await response;
    }

    function copyPlaylist(response) {
        console.log(response)
        //TODO: figure out how to create new playlist & copy tracks there
    }
}())