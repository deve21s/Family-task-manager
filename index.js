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
const Comment = require("./models/comment");
const Reply = require("./models/reply");
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
  let { _id, role, familyId, name } = data[0];
  let member = {
    name,
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
    res.status(201).json(error.message);
  }
});
//ragister data to member collection
app.post("/ragister", async (req, res) => {
  const { email, password, username } = req.body;
  const isunique = await Member.find({ email: email });
  if (isunique.length === 0) {
    const family = new Family({ Tasks: [] });
    const famdet = await family.save();
    const user = new Member({
      name: username,
      email: email,
      password: password,
      role: "admin",
      familyId: famdet._id,
    });
    const data = await user.save();
    let member = {
      id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      familyid: data.familyId,
    };

    const accesstoken = jwt.sign(member, process.env.TOKEN_SECRET, {
      expiresIn: "1day",
    });
    return res.json(accesstoken);
  }
  res.status(201).json("email already ragistered");
});

//add member
app.post("/addmember", midelwere, async (req, res) => {
  const { name, email } = req.body;
  const { familyid } = req.user;
  const isunique = await Member.find({ email: email });
  // if (isunique.length === 0) {
  let member = {
    name: name || "deven",
    email: email,
    role: "member",
    familyId: familyid,
  };
  const token = jwt.sign(member, process.env.TOKEN_SECRET);
  const result = await mailto(email, token);
  return res.json("mail send success");
});
//get family details
app.get("/memberlist", midelwere, async (req, res) => {
  const { familyid } = req.user;
  const meberlist = await Member.find({ familyId: familyid }, { password: 0 });
  res.json(meberlist);
});
//add task
app.post("/addtask", midelwere, async (req, res) => {
  const { familyid } = req.user;
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
app.get("/tasks", midelwere, async (req, res) => {
  //add family id by token
  const { familyid } = req.user;
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
  jwt.verify(token, process.env.TOKEN_SECRET, async function (err, decoded) {
    // err
    if (err) {
      console.log(err);
    }
    //else decode and add member to the member collection
    console.log(decoded);
    const member = new Member({ ...decoded, password });
    await member.save();
    res.json("ok");
  });
});

//task completed by only assigned parson
app.post("/task/:taskid", midelwere, async (req, res) => {
  const { taskid } = req.params;
  const task = await Tasks.findOneAndUpdate(
    { _id: taskid },
    { $set: { isCompleted: true } },
    { useFindAndModify: true }
  );
  res.json("ok");
});

//edit task my parson
app.post("/edittask/:taskid", midelwere, async (req, res) => {
  const { taskid } = req.params;
  const { title, des, dueDate, assign } = req.body;
  const task = {
    title: title,
    des: des,
    dueDate: dueDate,
    assign: assign,
  };
  console.log(task);
  const taskdetails = await Tasks.findOneAndUpdate(
    { _id: taskid },
    { $set: task },
    { useFindAndModify: true }
  );
  res.json("ok");
});

//single task
app.get("/task/:taskid", midelwere, async (req, res) => {
  const { taskid } = req.params;
  Tasks.findOne({ _id: taskid })
    .populate({
      path: "comments",
      populate: {
        path: "replys",
      },
    })
    .then((task) => {
      console.log(task);
      res.json(task);
    });
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
    html: `click to the link to set password : <a href="https://ftm-psi.vercel.app/setpassword/${token}">setpassword</a>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return "try again";
    } else {
      return "mail send success";
    }
  });
};

//delete task id from family Tasks and also from task list
app.get("/task/:taskid/delete", midelwere, async (req, res) => {
  const { taskid } = req.params;
  const familyId = req.user.familyid;
  const family = await Family.findById(familyId);
  const task = await Tasks.findById(taskid);
  family.Tasks = family.Tasks.filter((t) => t.toString() !== taskid);
  task.remove();
  await family.save();
  res.json("ok");
});

//add comment to the task
app.post("/comment/:taskid", midelwere, async (req, res) => {
  const { taskid } = req.params;
  const { text } = req.body;
  const comm = {
    text: text,
    name: req.user.name || "deven",
  };
  const tasks = await Tasks.findById({ _id: taskid });
  console.log(tasks);
  const comment = new Comment(comm);
  tasks.comments.push(comment);
  const newcomment = await comment.save();
  await tasks.save();
  res.json(newcomment);
});

app.post("/comment/:commentid/reply", midelwere, async (req, res) => {
  const id = req.params.cid;
  const comment = await Comment.findById(id);
  let { text } = req.body;
  let replaybody = {
    name: req.user.name,
    text: text,
  };
  const reply = new Reply(replaybody);
  comment.replys.push(reply);
  await reply.save();
  await comment.save();
});
