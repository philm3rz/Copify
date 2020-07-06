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
        playlistID = `${event.target.value}`;
        getPlaylist(playlistID)
            .then(playlistObj => {
                //Display name of playlist
                document.querySelector('#playlist-data').innerHTML = `Copy this playlist: ${playlistObj.name}`;

                //Display button for starting copy process
                let copy = document.querySelector('#copy')
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

        // TODO: this only gets 100 tracks, write loop to get ALL tracks even if > 100
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
            for (song in response.items) {
                songs.push(response.items[song].track.uri);
            }
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