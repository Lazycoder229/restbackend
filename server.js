const myFramework = require("./index");
const app = myFramework();

let users = [
  { id: 1, name: "Alvin", age: 22 },
  { id: 2, name: "Jane", age: 23 },
];

app.use(myFramework.json());

//  CREATE
app.post("/users", (req, res) => {
  const newUser = { id: Date.now(), ...req.body };
  users.push(newUser);
  res.status(201).send({ message: "User added successfully", user: newUser });
});

// 🔵 READ ALL
app.get("/users", (req, res) => res.send(users));

// READ ONE
app.get("/users/:id", (req, res) => {
  console.log("Received params:", req.params);
  console.log("Request URL:", req.url);
  const user = users.find((u) => u.id == req.params.id);
  if (!user) return res.status(404).send({ error: "User not found" });
  res.send(user);
});

// UPDATE
app.put("/users/:id", (req, res) => {
  const user = users.find((u) => u.id == req.params.id);
  if (!user) return res.status(404).send({ error: "User not found" });

  Object.assign(user, req.body);
  res.send({ message: "User updated successfully", user });
});

// DELETE
app.delete("/users/:id", (req, res) => {
  users = users.filter((u) => u.id != req.params.id);
  res.send({ message: "User deleted" });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
