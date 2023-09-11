const app = require("./app");

app.listen(process.env.PORT, () => {
  console.log(`Server is running port ${process.env.PORT}`);
});
