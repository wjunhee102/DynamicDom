function printMultiplicationTable(view = 4) {
  for (let i = 2; i < 9; i += view) {
    for (let k = 1; k < 10; k++) {
      const str = Array
                  .from({ length: view })
                  .map((_, index) => index + i)
                  .reduce((acc, cur) => acc += `${cur} * ${k} = ${cur * k} `, "");

      console.log(str);
    }
    console.log("");
  }
}

printMultiplicationTable(3);