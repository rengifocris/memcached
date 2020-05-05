const MemoryCached = require('./memcached/memory');

let memoryCached = new MemoryCached();

memoryCached.set("llave1","value1", 1000);
console.log('Llave1 is ' + memoryCached.get("llave1"));
setTimeout( function() {
    console.log('Llave1 after 2 seconds is ' + memoryCached.get("llave1"));

    memoryCached.add("llave1","value2", 1000);

    memoryCached.add("llave2","value2", 1000);

    memoryCached.replace("llave2","value3", 5000);
    console.log('llave2 after replace is ' + memoryCached.get("llave2"));

    memoryCached.append("llave2", " concatenacion");
    console.log('llave2 after append is ' + memoryCached.get("llave2"));

    memoryCached.prepend("llave2", "concatenacion previa ");
    console.log('llave2 after preappend is ' + memoryCached.get("llave2"));

    let casToken = memoryCached.gets("llave2").cas; 
    console.log('llave2 after gets is ', memoryCached.gets("llave2"));

    memoryCached.cas("llave2","value5", 5000, casToken, 1);
    memoryCached.cas("llave2","value5", 5000, casToken, 2);
}, 2000);

