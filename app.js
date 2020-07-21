(function () {
    const ENDPOINT = "https://api.spotify.com/v1/playlists/"
    let hash;
    let scope = encodeURIComponent('playlist-modify-private')

    //Set authorization link for obtaining spotify token
    document.querySelector('#auth-link').href = `https://accounts.spotify.com/authorize?response_type=token&client_id=9c334c20058b429b83dd30f49fddc57f&redirect_uri=https%3A%2F%2Fphilm3rz.github.io%2FCopify%2F&show_dialog=true&scope=${scope}`

    // Obtain hash from URL parameters if not obtained yet
    if (!hash) authenticate();

    //Let user enter playlist ID, then get playlist info and display in card
    playlistInput = document.querySelector('#playlist');

    createTypingEvent();

    playlistInput.addEventListener('stopTyping', (event) => {

        playlistID = `${event.target.value}`;
        getPlaylist(playlistID)
            .then(playlistObj => {
                // Display embedded playlist to tell user that ID is valid
                document.querySelector("#embed").src = `https://open.spotify.com/embed/playlist/${playlistID}`;
                document.querySelector("#embed").style.display = 'block';
                //Display button for starting copy process
                let copy = document.querySelector('#copy');
                copy.disabled = false;
                copy.addEventListener('click', () => copyPlaylist(playlistObj));
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

        // Proceed in UX if auth was successfull
        if (hash) document.querySelector('#auth-link').style.display = 'none';
        if (hash) document.querySelector('#outer').style.display = 'block';
    }

    async function getPlaylist(playlistID) {
        return spotifyRequest(`${ENDPOINT}${playlistID}`);
    }

    async function copyPlaylist(playlist) {

        // Get user id
        let response = await spotifyRequest(`https://api.spotify.com/v1/me`);
        const userID = response.id;

        // Create playlist with name
        response = await spotifyRequest(`https://api.spotify.com/v1/users/${userID}/playlists`, {
            'name': playlist.name,
            'public': false
        });
        cpPlaylistID = response.id;

        songsIn100 = [];
        total = 100;
        tracksReturned = 0;
        let working = true;
        while (tracksReturned < total && working) {
            response = await spotifyRequest(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?offset=${tracksReturned}&fields=total,items(track(uri))`)
            if (response !== "") {
                console.log(response)
                total = response.total;
                tracksReturned += 100;
                songs = [];
                // Map URIs to new array and filter out local tracks
                songs = response.items.map(item => item.track.uri).filter(uri => !uri.includes("local"));
                songsIn100.push(songs);
            } else working = false;
        }

        if (working) {
            document.querySelector('#error-msg').style.display = 'block';
            document.querySelector('#error-msg').innerHTML = 'Your playlist is copied';

            console.log(songsIn100);

            // Add songs to playlist
            for (songs in songsIn100) {
                spotifyRequest(`https://api.spotify.com/v1/playlists/${cpPlaylistID}/tracks`, {
                    'uris': songsIn100[songs],
                });

            }
        }
    }

    function spotifyRequest(endpoint, body) {
        // Define header & request params 
        params = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${hash}`,
                'Content-Type': 'application/json'
            }
        }

        if (body !== undefined) {
            params.method = 'POST',
                params.body = JSON.stringify(body)
        }

        console.log(`Endpoint: ${endpoint}\nParams:${params}`);

        // Do actual request
        return fetch(endpoint, params)
            .then((r) => {
                console.log(r.status)
                if (r.status == 200 || r.status == 201) return r.json();
                else return "";
            })
    }

    // Captures when the user stops typing, and dispatches the stopTyping event after 3 seconds
    function createTypingEvent() {
        const stopTypingEvent = new Event('stopTyping');
        let timer;

        playlistInput.addEventListener('keypress', (event) => {
            if (!timer) window.clearTimeout(timer);
        });
        playlistInput.addEventListener('keyup', (event) => {
            if (timer) window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                if (event.target.value.length == 22) playlistInput.dispatchEvent(stopTypingEvent);
            }, 1000);
        });
    }

}())
