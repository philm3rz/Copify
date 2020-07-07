(function () {
    const ENDPOINT = "https://api.spotify.com/v1/playlists/"
    let hash;
    let scope = encodeURIComponent('playlist-modify-private')

    // Set auth link
    document.querySelector('#auth-link').href = `https://accounts.spotify.com/authorize?response_type=token&client_id=9c334c20058b429b83dd30f49fddc57f&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2F&show_dialog=true&scope=${scope}`

    // Redirect user for auth if not done yet
    if (!hash) authenticate();

    //Let user enter playlist ID, then get playlist info
    document.querySelector('#playlist').addEventListener('change', (event) => {
        document.querySelector('#playlist').style.display = 'none';

        playlistID = `${event.target.value}`;
        getPlaylist(playlistID)
            .then(playlistObj => {

                //Display button for starting copy process
                let copy = document.querySelector('#copy')
                copy.innerHTML += ` ${playlistObj.name}`;
                copy.style.display = 'block';
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
        if (hash) document.querySelector('#playlist').style.display = 'block';
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

    // TODO: put api requests in separate function for dryness
    async function copyPlaylist(playlist) {
        console.log(playlist)

        // Get user id
        let response = await fetch(`https://api.spotify.com/v1/me`, {
            headers: {
                'Authorization': `Bearer ${hash}`
            }
        });
        await response.json().then(data => {
            response = data
        })
        const userID = response.id;

        // Create playlist with name
        response = await fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hash}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'name': playlist.name,
                'public': false
            })
        });
        await response.json().then(data => {
            response = data
        });
        console.log(response);
        cpPlaylistID = response.id;

        songsIn100 = [];
        total = 100;
        tracksReturned = 0;
        while (tracksReturned < total) {
            response = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?offset=${tracksReturned}&fields=total,items(track(uri))`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${hash}`
                }
            });
            await response.json().then(data => {
                response = data;
            })
            total = response.total;
            tracksReturned += 100;
            songs = [];

            // Map URIs to new array and filter out local tracks
            songs = response.items.map(item => item.track.uri).filter(uri => !uri.includes("local"));
            songsIn100.push(songs);
        }

        console.log(songsIn100);
        

        // Add songs to playlist
        for (songs in songsIn100) {
            response = await fetch(`https://api.spotify.com/v1/playlists/${cpPlaylistID}/tracks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${hash}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // Placeholder songs REMOVE
                    'uris': songsIn100[songs],
                })
            })
            await response.json().then(data => {
                response = data
            })
            console.log(response)
        }



    }
}())