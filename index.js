const express = require("express");
const mongooese = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
//mongodb models
const Family = require("./models/famaliy");
const Member = require("./models/member");
const Tasks = require("./models/Tasks");
//midelwere
const midelwere = require("./controllers/midelwere/midelwere");

const PORT = process.env.PORT || 3000;
mongooese
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log("app runnging on port", PORT);
      const url = new URL(`http://localhost:${PORT}`);
      console.log(url.href);
    });
  })
  .catch((error) => {
    console.log(error);
  });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.post("/login", midelwere, (req, res) => {
  const { user } = req;
  console.log(user);
  res.send("hello");
});

app.post("/ragister", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  const isunique = await Member.find({ email: email });
  if (isunique.length === 0) {
    const family = new Family({});
    const famdet = await family.save();
    const user = new Member({
      email: email,
      password: password,
      role: "admin",
      familyId: famdet.id,
    });
    const data = await user.save();
    const accesstoken = jwt.sign({ user: data }, process.env.TOKEN_SECRET);
    return res.json(accesstoken);
  }
  res.send("try");
});

//add member. for this we need family id
//check email middleware function
//auth function
app.post("/addmember/:familyid", async (req, res) => {
  const { name, email } = req.body;
  const { familyid } = req.params;
  const isunique = await Member.find({ email: email });
  console.log(isunique);
  if (isunique.length === 0) {
    const mem = {
      name: name,
      email: email,
      role: "member",
      familyId: familyid,
    };
    const member = new Member(mem);
    await member.save();
    return res.json("ok");
  }
  res.send("okk");
});
//add task family id
app.post("/addtask/:familyid", async (req, res) => {
  const { familyid } = req.params;
  const family = await Family.findById(familyid);
  const taskdetails = {
    title: "task1",
    des: "task1 details",
    dueDate: "2day",
    isCompleted: false,
    assign: "deven",
  };
  const task = new Tasks(taskdetails);
  const taskid = await task.save();
  family.Tasks.push(taskid);
  await family.save();
  res.send("ok");
});
//get family details
app.get("/memberlist/:familyid", async (req, res) => {
  const { familyid } = req.params;
  const meberlist = await Member.find({ familyId: familyid }, { password: 0 });
  res.json(meberlist);
});

// family task
app.get("/family/:familyid", async (req, res) => {
  const { familyid } = req.params;
  Family.findById(familyid)
    .populate("Tasks")
    .then((data) => {
      res.json(data);
    });
});

//set password

app.post("/setpassword", (req, res) => {
  const member = {
    email: "panchaldevendra987@gmail.com",
    password: "devendra",
    role: "admin",
    familyId: "60b9f4d27ad8fc14d08769f8",
  };
});

// var nodemailer = require("nodemailer");

// var transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "panchaldevendra987@gmail.com",
//     pass: "",
//   },
// });

// var mailOptions = {
//   from: "panchaldevendra987@gmail.com",
//   to: "panchaldevendra522@gmail.com",
//   subject: "Sending Email using Node.js",
//   text: "That was easy!",
// };

// transporter.sendMail(mailOptions, function (error, info) {
//   if (error) {
//     console.log(error);
//   } else {
//     console.log("Email sent: " + info.response);
//   }
// });

//
