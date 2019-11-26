const Musix = artifacts.require('./Musix.sol')
const songs = [{
  '_ipfs': 'QmXcJhWPnmyGGqBh24crS8u5gGzNpBudDf2CJXwLMmVb3f',
  '_title': 'Infinitease',
  '_artist': 'Greydon Square',
  '_album': 'Omniverse:Type 3',
  '_genre': 'SciRap'
}, {
  '_ipfs': 'QmVA6s4Z3YFqnhQW7DC3bihi8rwgYkGMLtUFWyi1kNfvSn',
  '_title': 'Gilgamesh',
  '_artist': 'Baba Brinkman',
  '_album': 'Rapconteur',
  '_genre': 'Rapoetry'
}]
module.exports = function (deployer) {
  let musix
  let song
  deployer.deploy(Musix).then(function (instance) {
    musix = instance
    song = songs[0]
    console.log('Adding 0th music :', song._artist, song._album, song._title, song._genre, song._ipfs)
    return musix.setMusix(song._genre, song._artist, song._album, song._title, song._ipfs)
  }).then(function (_dat) {
    console.log(_dat)
    song = songs[1]
    console.log('Adding 1st music :', song._artist, song._album, song._title, song._genre, song._ipfs)
    return musix.setMusix(song._genre, song._artist, song._album, song._title, song._ipfs)
  }).then(console.log)
}
