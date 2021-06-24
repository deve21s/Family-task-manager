const express = require("express");
const mongooese = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const app = express();
//mongodb models
const Family = require("./models/famaliy");
const Member = require("./models/member");
const Tasks = require("./models/Tasks");
//midelwere
const midelwere = require("./controllers/midelwere/midelwere");

const PORT = process.env.PORT || 5000;
const email = process.env.email;
const password = process.env.password;
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
app.use(cors());
app.use(express.json());

//login and get token
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const data = await Member.find({ email: email, password: password });
  let { _id, role, familyId } = data[0];
  let member = {
    id: _id,
    email: email,
    role: role,
    familyid: familyId,
  };
  try {
    if (data.length !== 0) {
      const accesstoken = jwt.sign(member, process.env.TOKEN_SECRET);
      return res.json(accesstoken);
    } else {
      throw Error("email or password are Incorrect.");
    }
  } catch (error) {
    res.json(error.message);
  }
});
//ragister data to member collection
app.post("/ragister", async (req, res) => {
  console.log(req.body);
  const { email, password, username } = req.body;
  const isunique = await Member.find({ email: email });
  if (isunique.length === 0) {
    const family = new Family({});
    const famdet = await family.save();
    const user = new Member({
      name: username,
      email: email,
      password: password,
      role: "admin",
      familyId: famdet.id,
    });
    const data = await user.save();
    const accesstoken = jwt.sign({ user: data }, process.env.TOKEN_SECRET, {
      expiresIn: "1day",
    });
    return res.json(accesstoken);
  }
  res.send("try");
});

//add member. for this we need family id
app.post("/addmember/:familyid", async (req, res) => {
  const { name, email } = req.body;
  const { familyid } = req.params;
  const isunique = await Member.find({ email: email });
  console.log(isunique);
  // if (isunique.length === 0) {
  let member = {
    name: name,
    email: email,
    role: "member",
    familyId: familyid,
  };
  const token = jwt.sign(member, process.env.TOKEN_SECRET);
  const result = mailto(email, token);

  return res.json(result);

  // const mem = {
  //   name: name || "deven",
  //   email: email,
  //   role: "member",
  //   familyId: familyid,
  // };
  // const member = new Member(mem);
  // await member.save();
  // return res.json("ok");
  // }
});
//get family details
app.get("/memberlist/:familyid", async (req, res) => {
  const { familyid } = req.params;
  const meberlist = await Member.find({ familyId: familyid }, { password: 0 });
  res.json(meberlist);
});
//add task
app.post("/addtask/:familyid", async (req, res) => {
  const { familyid } = req.params;
  const { title, description, date, assign } = req.body;
  const family = await Family.findById(familyid);
  const taskdetails = {
    title: title,
    des: description,
    dueDate: date,
    isCompleted: false,
    assign: assign,
  };
  const task = new Tasks(taskdetails);
  const taskid = await task.save();
  family.Tasks.push(taskid);
  await family.save();
  res.json(taskid);
});

// all tasks
app.get("/tasks/:familyid", async (req, res) => {
  const { familyid } = req.params;
  Family.findById(familyid)
    .populate("Tasks")
    .then((info) => {
      const data = info.Tasks;
      res.json(data);
    });
});

//set password
//token required
app.post("/setpassword", (req, res) => {
  const { password, token } = req.body;
  const user = jwt.decode(token);
  const data = { ...user, password };
  console.log(data);
  res.json(data);
});

//task completed by only assigned parson
app.post("/task/:taskid/:familyid", async (req, res) => {
  const { taskid } = req.params;
  const task = await Tasks.findOneAndUpdate(
    { _id: taskid },
    { $set: { isCompleted: true } },
    { useFindAndModify: true }
  );
  res.json("ok");
});

//edit task my parson
app.post("/edittask/:taskid/:familyid", async (req, res) => {
  const { taskid } = req.params;
  const taskss = req.body.task;
  const task = await Tasks.findOneAndUpdate(
    { _id: taskid },
    { $set: taskss },
    { useFindAndModify: true }
  );
  res.json("ok");
});

//single task
app.get("/task/:taskid", async (req, res) => {
  const { taskid } = req.params;
  const task = await Tasks.findById({ _id: taskid });
  res.json(task);
});
var nodemailer = require("nodemailer");

const mailto = (email, token) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });
  var mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "invitation for the FTM account login",
    html: `click to the link to set password : <a href="http://localhost:3000/setpassword/${token}">setpassword</a>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return "mail faild";
    } else {
      return "mail send success";
    }
  });
};
