const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const { Error } = require("mongoose");
const Card = require("../models/Card.model");

const hasCorrectPassword = (password) => {
  const passwordRegex = new RegExp(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/);
  return passwordRegex.test(password);
};

const isMongooseValidationError = (error) =>
  error instanceof Error.ValidationError;

const isMongoError = ({ code: errorCode }) => errorCode === 11000;

const renderMessage = (res, page, alert) => {
  return res.render(page, { alert });
};

const getRandomArray = () => {
  //genera un Array de 6 números aleatorios correspondientes a 6 cartas
  const arrayRandom = [];
  for (let i = 0; i < 6; i++) {
    let numRandom = Math.floor(Math.random() * 67);
    while (arrayRandom.includes(numRandom))
      numRandom = Math.floor(Math.random() * 67); //evitamos introducir números random repetidos
    arrayRandom.push(numRandom);
  }
  return arrayRandom;
};

const randomCards = (arrayCards) => {
  //de todas las cartas devuelve un array con las coincidentes con los índices aleatorios

  const arrayRandom = getRandomArray();
 
  return arrayCards.filter((card, index) => arrayRandom.includes(index));
};

const signIn = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    
    const missingCredentials = !password || !email || !username;

    if (missingCredentials) return res.send("missing credentials");

    if (!hasCorrectPassword(password))
      return renderMessage(res, "signIn", "Incorrect password format");

    const usuario = User.findOne({ username }).lean();
   
    if (!usuario) return renderMessage(res, "signIn", "user already exist"); //Esto no acaba de funcionar --> no es necesario al lanzar mongo un error

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    //añadimos foto de avatar inicial
    const avatarImg = "/img/avatar.png";

    const {
      _doc: { passwordHash, ...user },
    } = await User.create({
      email,
      passwordHash: hashedPassword,
      username,
      imgUser: avatarImg,
    });
   
    req.session.currentUser = user;
    res.render("openingIntro");
  } catch (err) {
    if (isMongooseValidationError(err)) {
      console.error(err);
      return renderMessage(res, "signIn", "validation error: " + err.message);
    }

    if (isMongoError(err)) {
      return renderMessage(res, "signIn", "mongo error: " + err.message);
    }

    console.error(err);
  }
};

const logIn = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    const missingCredentials = !password || !username;
    if (missingCredentials) {
      return res.send("missing credentials");
    }
    const usuario = await User.findOne({ username }).lean();
    if (!usuario) return renderMessage(res, "logIn", "user does not exist");

    const { passwordHash, ...user } = usuario;

    const verifiedPassword = await bcrypt.compare(password, passwordHash);
    if (!verifiedPassword) return renderMessage(res, "logIn", "Wrong password");

   
    req.session.currentUser = user;
    return res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    return renderMessage(res, "logIn", "validation error: " + err.message);
  }
};

const openFirst = async (req, res, next) => {
  try {
    //comprobamos que estamos ya logueados
    if (!req.session.currentUser)
      return renderMessage(res, "logIn", "Please Login first");
    
    const username = req.session.currentUser.username;

    //comprobamos a continuación que realmente sea la primera vez que entramos( no hay cartas en la DB)
    const { cards } = await User.findOne({ username }, { cards: 1, _id: 0 });
    
    if (cards.length != 0) return res.redirect("/dashboard");

    //obtenemos las 6 cartas al azar
    const cartas = await Card.find();
    const finalCards = randomCards(cartas);
    const finalCardsId = finalCards.map((card) => card["_id"]);

    //introducimos los id de las cartas en el usuario
    const usuario = await User.findOneAndUpdate(
      { username },
      { $push: { cards: { $each: finalCardsId } } },
      { new: true }
    ).lean();

    const { passwordHash, ...user } = usuario;

    //actualizo la sesión para que el usuario este actualizado con cartas
    req.session.currentUser = user;
    //mostramos ahora las primeras cartas al usuario

    res.render("firstCards", { finalCards });

    
  } catch (err) {
    console.error(err);
  }
};

const mainProfile = async (req, res) => {
  try {
    const datosUsuario = req.session.currentUser;
    if (!datosUsuario) return renderMessage(res, "logIn", "Please Login first");

    const usuario = await User.findOne({ username: datosUsuario.username }).lean();
    

    const { passwordHash, ...user } = usuario;

    const { username } = usuario;
    const { cards } = await User.findOne({ username }).populate("cards");
    const datos = { ...usuario, cards };
    res.render("mainProfile", datos);
  } catch (e) {
    console.log(e);
  }
};

const userData = (req, res) => {
  if (!req.session.currentUser)
    return renderMessage(res, "logIn", "Please Login first");
  res.render("editProfile", req.session.currentUser);
};

const changeUserData = async (req, res) => {
  try {
    if (!req.session.currentUser)
      return renderMessage(res, "logIn", "Please Login first");

    const usernameSession = req.session.currentUser.username;

    let imageUrl;
    const { username, email } = req.body;
    //comprobamos si se ha enviado un nuevo archivo
    if (req.file) {
      imageUrl = req.file.path;
    } else {
      imageUrl = req.body.existingImage; //Para utilizar más adelante cuando actualicemos más datos y este no cambie
    }

    const usuario = await User.findOneAndUpdate(
      { username: usernameSession },
      { imgUser: imageUrl, username, email },
      { new: true }
    ).lean();

    const { passwordHash, ...user } = usuario;
    
    req.session.currentUser = user;
    res.redirect("/userdata");
  } catch (err) {
    console.error(err);
  }
};

const cardsProfile = async (req, res) => {
  try {
    const datosUsuario = req.session.currentUser;
    if (!datosUsuario) return renderMessage(res, "logIn", "Please Login first");
    const { username } = datosUsuario;
    const { cards } = await User.findOne({ username }).populate("cards");
    const datos = { ...datosUsuario, cards };
    res.render("cardsProfile", datos);
  } catch (e) {
    console.log(e);
  }
};

const cardDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const datosUsuario = req.session.currentUser;
    if (!datosUsuario) return renderMessage(res, "logIn", "Please Login first");
    const card = await Card.findById(id);
   
    res.render("cardDetails", card);
  } catch (e) {
    console.log(e);
  }
};

const logOut = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};

module.exports = {
  logIn,
  signIn,
  openFirst,
  mainProfile,
  userData,
  changeUserData,
  cardsProfile,
  logOut,
  cardDetail,
  
};
