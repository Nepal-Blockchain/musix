import {
  default as Web3
} from 'web3'

import Ipfs from "./ipfs.min.js"


import ABI from './Musix.json'
// 0x85505E7a4A49a3A0d8f12Fa172f461CE399fE97d

import './player'
let Musix
let accounts
let account
let ipfs
let fileSize
let infura = false

let mp3Selector = document.getElementById('mp3Select')
let mp3File = document.getElementById('mp3File')
let uploadBtn = document.getElementById('upload')
let addFileBtn = document.getElementById('addFileBtn')
let addClose = document.getElementById('addClose')
let filterBtn = document.getElementById('filterFileBtn')
let filterClose = document.getElementById('filterClose')

const App = {
  ipfs: {},
  infura: (_file) => {
    const formData = new FormData()
    formData.append('file', _file)
    const options = {
      method: 'POST',
      body: formData,
    }
    console.log("uploading to infura")
    fetch('https://ipfs.infura.io:5001/api/v0/add', options).then(console.log)
  },
  start: () => {
    Musix = new web3.eth.Contract(ABI.abi, ABI.address)
    window.Musix = Musix

    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert('There was an error fetching your accounts.')
        return
      }

      if (accs.length === 0) {
        accs[0] = web3.eth.defaultAccount = web3.eth.accounts.create().address
        // alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
        return
      }

      accounts = accs
      account = accounts[0]
    })
  },
  toUTF8: (_bytes) => {
    return web3.utils.toUtf8(_bytes)
  },
  fromAscii: (_bytes) => {
    return web3.utils.fromAscii(_bytes)
  },
  setStatus: (message) => {
    document.getElementById('status').innerHTML = message
  },
  setMusix: (_ipfs) => {
    let _artist = document.getElementById('_artist').value
    let _album = document.getElementById('_album').value
    let _title = document.getElementById('_title').value
    let _genre = document.getElementById('_genre').value
    Musix.methods.setMusix(
        App.fromAscii(_artist), App.fromAscii(_album),
        App.fromAscii(_title), App.fromAscii(_genre),
        App.fromAscii(_ipfs))
      .send({
        from: account
      }).then(() => {
        App.setStatus('Transaction complete!')
      }).catch(App.onError)
    uploadBtn.disabled = false
  },
  onError: (err) => {
    let msg = 'An error occured, check the dev console'
    if (err.stack !== undefined) {
      msg = err.stack
    } else if (typeof err === 'string') {
      msg = err
    }
    console.warn(msg)
  },

  // IPFS functions
  initIPFS: () => {
    ipfs = new Ipfs({
      repo: 'musix'
    })

    ipfs.once('ready', () => {
      console.log('Online status: ', ipfs.isOnline() ? 'online' : 'offline')
      App.setStatus('Node status: ' + (ipfs.isOnline() ? 'online' : 'offline'))
    })

    ipfs.once('start', () => {
      App.ipfs = ipfs
      ipfs.id()
        .then((id) => {
          console.log("IPFS", id)
        })
        .catch(App.onError)
    })
  },
  stopIPFS: () => {
    if (ipfs.isOnline) {
      ipfs.stop(() => {
        App.setStatus('IPFS node is ' + (ipfs.isOnline() ? 'online' : 'offline'))
      })
    }
  },
  addFile: (_file) => {
    console.log(Ipfs.Buffer, Ipfs.types)
    // let _buffer = new Ipfs.Buffer
    App.readFileContents(_file)
      .then((buffer) => {
        fileSize = _file.size
        ipfs.add({
          path: _file.name,
          content: Ipfs.Buffer(buffer)
        }, {
          progress: App.updateProgress
        }, (err, filesAdded) => {
          if (err) {
            return App.onError(err)
          }
          App.infura(_file)
          document.getElementById('_ipfsHash').value = filesAdded[0].hash
          App.setMusix(filesAdded[0].hash)
        })
      })
      .catch(App.onError)
  },
  updateProgress: (bytesLoaded) => {
    let percent = Math.floor((bytesLoaded / fileSize) * 100)
    App.setStatus(percent + '%')
  },
  readFileContents: (_file) => {
    return new Promise((resolve) => {
      const reader = new window.FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.readAsArrayBuffer(_file)
    })
  },
  isOnline: () => {
    return ipfs.isOnline
  }
}

window.App = App
window.addEventListener('load', async () => {
  if (window.ethereum) {
    window.web3 = new Web3(ethereum)
    window.ethereum.autoRefreshOnNetworkChange = false

    try {
      await ethereum.enable()
    } catch (error) {
      console.log('Access Denied : ', error)
    }
  } else if (window.web3) {
    window.web3 = new Web3(web3.currentProvider)
  } else {
    infura = true
    window.web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/5070fb8309944f18aa07840da75a9da9'))
  }

  player.init()
  App.start()
  App.initIPFS()
  if (!infura) {
    Musix.events.NewMusix({
        fromBlock: 3412571,
        toBlock: 'latest'
      })
      .on('data', function (event) {
        let _music = event.returnValues
        let _hash = App.toUTF8(_music.id)
        player.addToList({
          'album': App.toUTF8(_music.album),
          'title': App.toUTF8(_music.title),
          'artist': App.toUTF8(_music.artist),
          'id': _hash
        })
      })
      .on('error', App.onError)
  } else {
    Musix.getPastEvents('NewMusix', {
        fromBlock: 3412571,
        toBlock: 'latest'
      })
      .then(function (events) {
        events.forEach((event) => {
          let _music = event.returnValues
          player.addToList({
            'album': App.toUTF8(_music.album),
            'title': App.toUTF8(_music.title),
            'artist': App.toUTF8(_music.artist),
            'id': App.toUTF8(_music.id)
          })    
          // player.shuffleList()
        })
      })
      .catch('error', App.onError)
  }

  mp3Selector.onclick = function (e) {
    e.preventDefault()
    mp3File.click()
  }

  mp3File.onchange = () => {
    let _file = mp3File.files.item(0)
    if (_file !== null) {
      player.id3(_file)
      uploadBtn.disabled = false
      // console.log(id3)
    }
  }

  uploadBtn.onclick = () => {
    uploadBtn.disabled = true
    let _file = mp3File.files.item(0)
    if (_file !== null) {
      App.addFile(_file)
    }
  }

  addFileBtn.addEventListener("click", player.toggleUpload)
  addClose.addEventListener("click", player.toggleUpload)
  filterBtn.addEventListener("click", player.toggleUpload)
  filterClose.addEventListener("click", player.toggleUpload)
  audio.addEventListener('timeupdate', player.handleProgress)
})