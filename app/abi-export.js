const fs = require('fs')
const artifact = require('../build/contracts/Musix.json')
let Musix = {}
Musix.address = artifact.networks['4'].address
Musix.abi = artifact.abi
fs.writeFile('./app/Musix.json', JSON.stringify(Musix), (err) => {
  if (err) {
    console.error(err)
    return
  }
  console.log('Using Contract at', Musix.address)
})
