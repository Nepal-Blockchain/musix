let source = document.getElementById('source')
let audio = document.getElementById('audio')
let songs = document.getElementById('song-list')
let searchbox = document.getElementById('search')
let songList = document.getElementById('song-list')
let lyrics = document.getElementById('cover-lyrics')
let playpausebutton = document.getElementById('play-pause')
let artists, genre
let songNodes = []
let currentSongID = -1
let songArray = []
let originalSongList = []
let currentSongIndex
let isUploading = false
let started = false
let repeatSong = false
let searching = false
let timeoutFetch = null
let jsmediatags = require('jsmediatags')
const fileType = require('file-type')
let newUpload = false

const player = {
  toggleUpload: ()=>{
    newUpload = !newUpload
  },
  Vol: (_val) => {
    audio.volume = _val / 100
  },
  addArtist: (_artist) => {
    if (!artists.includes(_artist)) {
      artists.push(_artist)
    }
  },
  addGenre: (_genre) => {
    if (!genre.includes(_genre)) {
      genre.push(_genre)
    }
  },
  addToList: (_song) => {
    originalSongList.push(_song)
    player.init()
  },
  toggleUpload: () => {
    isUploading = !isUploading
  },
  getBlob: (_data, _mime) => {
    let urlCreator = window.URL || window.webkitURL
    let blob = new Blob([new Uint8Array(_data)], {
      type: _mime
    })
    return urlCreator.createObjectURL(blob)
  },
  id3Cover: (_file) => {
    let pcover = document.getElementById('player-cover')
    jsmediatags.read(_file, {
      onSuccess: (tags) => {
        let tag = tags.tags
        console.log(tag)
        if (tag.lyrics !== undefined) {
          lyrics.textContent = tag.lyrics.lyrics
        }
        if (tag.picture !== undefined) {
          pcover.setAttribute('src', player.getBlob(tag.picture.data, tag.picture.format))
        } else {
          pcover.setAttribute('src', './static/music_logo.png')
        }
      }
    })
  },
  id3: (_file) => {
    jsmediatags.read(_file, {
      onSuccess: (tags) => {
        console.log(tags)
        let tag = tags.tags
        document.getElementById('_artist').value = tag.artist
        document.getElementById('_album').value = tag.album
        document.getElementById('_title').value = tag.title
        if (tag.picture !== undefined) {
          document.getElementById('_cover').src = player.getBlob(tag.picture.data, tag.picture.format)
        } else {
          document.getElementById('_cover').src = './static/music_logo.png'
        }
      },
      onError: (error) => {
        console.log(':(', error.type, error.info)
      }
    })
  },
  init: () => {
    /* originalSongList = originalSongList.sort((a, b) {
      if (a.title.toLowerCase() < b.title.toLowerCase()) return -1
      if (a.title.toLowerCase() > b.title.toLowerCase()) return 1
      return 0
    }) */

    songArray = originalSongList
    player.initializeSongList()
  },
  initializeSongList: () => {
    while (songs.firstChild) songs.removeChild(songs.firstChild)
    songNodes = []

    for (let idx in songArray) {
      let song = songArray[idx]
      let songNode = document.createElement('div')
      songNode.setAttribute('class', 'song')
      if (song.id === currentSongID) {
        songNode.setAttribute('class', 'song song-current')
      }

      songNode.setAttribute('id', `song-${song.id}`)
      songNode.setAttribute(
        'onclick',
        `player.playSong(${idx}, '${song.id}', '${song.title}', '${song.artist}', '${song.album}')`,
      )

      let songindex = +idx + 1
      songNode.innerHTML = `
                <div class="song-leading">                                                       
                    <div class="song-avatar">${songindex}</div>                                         
                </div>
                <div class="song-trailing">                                                      
                    <div class="song-title">${song.title}</div>                                       
                    <div class="song-artist">${song.artist}</div>                                     
                </div>`
      songNodes.push(songNode)
      songs.appendChild(songNode)
      
    }
  },

  startPlayer: () => {
    let song = songArray[0]
    player.playSong(0, song.id, song.title, song.artist, song.album)
  },

  playSong: (index, id, title, artist, album) => {
    currentSongID = id
    if (!started) {
      audio.style.display = 'block'
      document.getElementById('cover-overlay').style.display = 'block'
      document.getElementById('player-placeholder').style.display = 'none'
    }

    let stat
    lyrics.textContent = ''
    if (timeoutFetch != null) {
      stat = undefined
      clearTimeout(timeoutFetch)
    }

    let songNode = document.getElementById(`song-${id}`)
    let ptitle = document.getElementById('player-title')
    let partist = document.getElementById('player-artist')
    let palbum = document.getElementById('player-album')
    let pcover = document.getElementById('player-cover')

    let songs = document.getElementsByClassName('song')
    for (let i = 0; i < songs.length; i++) {
      if (songs[i].getAttribute('class').includes('song-current')) {
        songs[i].setAttribute('class', 'song')
        break
      }
    }

    songNode.setAttribute('class', 'song song-current')

    ptitle.textContent = title
    partist.textContent = artist
    palbum.textContent = album
    // pcover.setAttribute('src', `https://ipfs.io/ipfs/QmU7VWfd3DN1Hh8fjALhQyJLgtkwxkYP2zz9MDT4rkyVJ1`)
    playpausebutton.style.backgroundImage = 'url("./static/pause.svg")'
    playpausebutton.style.backgroundSize = '20px 25px'
    playpausebutton.title = 'Pause the song.'
    started = true
    currentSongIndex = index
    player.ipfsCat(id)
    //timeoutFetch = setTimeout(() => {
      stat = player.ipfsStat(id)
      console.log('Tstat', stat, timeoutFetch)
    //}, 1000)
    console.log('xstat', stat)
  },
  ipfsLoad: (id) => {
    console.log('load', id)
    source.setAttribute('src', `https://ipfs.io/ipfs/${id}`)
    pcover.setAttribute('src', `./static/music_logo.png`)
    audio.load()
    audio.play()
  },
  ipfsStat: (id) => {
    console.log('stat', id)
    App.ipfs.files.stat(`/ipfs/${id}`)
      .then((stat) => {
        console.log("STATT", stat)
        return stat
      })
  },
  ipfsCat: (id) => {
    console.log('cat', id)
    App.ipfs.cat(`/ipfs/${id}`)
      .then((_f) => {
        let mime = fileType(new Uint8Array(_f))
        let url = player.getBlob(_f, mime.mime)
        player.id3Cover(_f)
        source.setAttribute('src', url)
        audio.load()
        audio.play()
      }).catch(App.onError)
  },
  cleanName: (name) => {
    // clean extra details in parenthesis
    let parIndex = name.indexOf('(')
    if (parIndex !== -1) {
      name = name.substring(0, parIndex)
    }

    // remove featuring artist
    let ftIndex = name.toLowerCase().indexOf('ft')
    if (ftIndex !== -1) {
      name = name.substring(0, ftIndex)
    }

    return name
  },
  shuffleList: () => {
    let counter = songArray.length
    while (counter > 0) {
      let index = Math.floor(Math.random() * counter)

      counter--

      let temp = songArray[counter]
      songArray[counter] = songArray[index]
      songArray[index] = temp
    }

    player.initializeSongList()
    player.startPlayer()
    songList.scrollTop = 0
  },
  nextSong: () => {
    if (currentSongIndex === songArray.length - 1) return

    let song = songArray[currentSongIndex + 1]
    currentSongIndex++

    let songNode = document.getElementsByClassName('song song-current')[0]
    songList.scrollTop += songNode.offsetHeight
    player.playSong(
      currentSongIndex,
      song.id,
      song.title,
      song.artist,
      song.album,
      song.picture,
    )
  },
  prevSong: () => {
    if (currentSongIndex === 0) return

    let song = songArray[currentSongIndex - 1]
    currentSongIndex--

    let songNode = document.getElementsByClassName('song song-current')[0]
    songList.scrollTop -= songNode.offsetHeight
    player.playSong(
      currentSongIndex,
      song.id,
      song.title,
      song.artist,
      song.album,
      song.picture,
    )
  },
  skipForward: () => {
    audio.currentTime += 15
  },
  skipBackward: () => {
    audio.currentTime -= 15
  },
  getIndex: (id) => {
    for (let i = 0; i < songArray.length; i++) {
      if (id === songArray[i].id) {
        return i
      }
    }
  },
  togglePlay: () => {
    if (!started) {
      audio.style.display = 'block'
      document.getElementById('cover-overlay').style.display = 'block'
      document.getElementById('player-placeholder').style.display = 'none'

      playpausebutton.style.backgroundImage = 'url("./static/pause.svg")'
      playpausebutton.style.backgroundSize = '20px 25px'
      playpausebutton.title = 'Pause the song.'

      player.startPlayer()
      started = true
      audio.play()
    } else if (audio.paused) {
      audio.play()

      playpausebutton.style.backgroundImage = 'url("./static/pause.svg")'
      playpausebutton.style.backgroundSize = '20px 25px'
      playpausebutton.title = 'Pause the song.'
    } else {
      audio.pause()

      playpausebutton.style.backgroundImage = 'url("./static/play.svg")'
      playpausebutton.style.backgroundSize = 'auto'
      playpausebutton.title = 'Play the song.'
    }
  },
  toggleRepeat: () => {
    if (repeatSong) {
      let repeatButton = document.getElementById('repeat-active')
      repeatButton.setAttribute('id', 'repeat-button-inactive')
      repeatSong = false
    } else {
      let repeatButton = document.getElementById('repeat-button-inactive')
      repeatButton.setAttribute('id', 'repeat-active')
      repeatSong = true
    }
  },
  resetList: () => {
    songArray.sort((a, b) => {
      return a.title.toLowerCase() > b.title.toLowerCase()
    })

    player.initializeSongList()
    player.startPlayer()
    songList.scrollTop = 0
  },
  handleProgress: () => {
    let progressWidth = audio.currentTime / audio.duration * 100
    document.getElementById('progress').style.width = progressWidth + '%'
    if (audio.currentTime === audio.duration) {
      if (repeatSong) {
        audio.currentTime = 0
        audio.play()
      } else {
        player.nextSong()
      }
    }
  },
  handleSearchFocus: (e) => {
    searching = true
  },
  handleSearchBlur: (e) => {
    searching = false
  },
  handleKeywordChange: (e) => {
    songArray = originalSongList.filter((song) => {
      return song.title.toLowerCase().includes(searchbox.value.toLowerCase())
    })

    player.initializeSongList()
  },
  scrollToCurrentAfterSearch: () => {
    searchbox.blur()
    searchbox.value = ''
    songArray = originalSongList
    player.initializeSongList()
    let songID = 'song-' + currentSongID
    for (let i = 0; i < songNodes.length; i++) {
      if (songID === songNodes[i].getAttribute('id')) {
        currentSongIndex = i
        break
      }
      songList.scrollTop += songNodes[i].offsetHeight
    }
  },
  handleKeypress: (e) => {
    if (isUploading) {
      if (e.which === 27) {
        document.getElementById('addClose').click()
        document.getElementById('filterClose').click()
        player.toggleUpload()
      } else {
        return
      }
    }

    if (e.which === 13) {
      e.preventDefault()
      player.startPlayer()
      player.scrollToCurrentAfterSearch()
      return
    } else if (e.which === 27) {
      e.preventDefault()
      player.scrollToCurrentAfterSearch()
    }

    if (searching) return
    if (newUpload) return

    switch (e.which) {
      case 32: // spacebar
        e.preventDefault()
        player.togglePlay()
        break
      case 37: // left
        e.preventDefault()
        player.skipBackward()
        break
      case 38: // up
      case 75: // k
        e.preventDefault()
        player.prevSong()
        break
      case 39: // right
        e.preventDefault()
        player.skipForward()
        break
      case 40: // down
      case 74: // j
        e.preventDefault()
        player.nextSong()
        break
      case 83: // s
        e.preventDefault()
        player.shuffleList()
        break
      case 88: // x
        e.preventDefault()
        player.resetList()
        break
      case 76: // L
        e.preventDefault()
        player.toggleRepeat()
        break
      case 191: // slash
        e.preventDefault()
        player.searchbox.focus()
        break
    }
  }
}
window.player = player
searchbox.addEventListener('input', player.handleKeywordChange)
searchbox.addEventListener('focus', player.handleSearchFocus)
searchbox.addEventListener('blur', player.handleSearchBlur)
window.addEventListener('keydown', player.handleKeypress)