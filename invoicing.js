let people = [{
    num: '260979046745@c.us',
    stage: 0,
    name: '',
    address: '',
    town: '',
    products: []
}]

let person = '260979046745@c.us';
const check = people.filter(function (elm) {
    if (elm.num === message.from){
        return elm;
    }
})