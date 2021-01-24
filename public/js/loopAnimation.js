
const imgCardPlayer = document.querySelector("#cardPlayerImg").value;

const imgCardOponent = document.querySelector("#cardOponentImg").value;

/*******Carga de imágenes ****/
var cardPlayer = new Image(); 
cardPlayer.src = `${imgCardPlayer}`;
var cardOponent = new Image(); 
cardOponent.src = `${imgCardOponent}`;
var portada= new Image(); 
portada.src = `/img/portada_fight.jpg`;
var golpe= new Image(); 
golpe.src = `/img/golpe.png`;

/********************************/

class Game1 {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = this.canvas.getContext("2d");
      this.isGameOver = false;
      this.yCardPlayer = 2*this.canvas.height/3;
      this.yCardOponent = 0;
      this.initialTime = Date.now();
      this.playerAtack = [true,false];
      this.oponentAtack = [false,false];
      this.cardWidth = this.canvas.height/5;
      this.cardLarge = this.canvas.height/3;
      this.cond = true;
      this.atackPlayerCond = false;
      this.atackOponentCond = false;
      this.condGolpePlayer = true;
      this.condGolpeOponent = true;
     }
  
    startLoop() {
      let timeReal = Date.now();
      
    
  
      const loop = () => {
       
  
        if(Date.now()-timeReal >10){ // defino el tiempo entre frames 
  
        this.updateCanvas();
        this.clearCanvas();
        this.drawCanvas();
  
        if (!this.isGameOver) {
          window.requestAnimationFrame(loop);
  
        }
        timeReal = Date.now();
      }else{
        window.requestAnimationFrame(loop);
      }
      };

      //this.printIntro();

      setTimeout(()=>{ this.printIntro(); }, 500);//retraso de medio segundo para que cargua la imagen de portada
      
      setTimeout(function(){ window.requestAnimationFrame(loop); }, 5000); //iniciamos el loop dando tiempoa cargar las imágenes

      
  
    }

    printIntro(){//pintamos la portada introductoria

      this.ctx.fillStyle="#371482"; //fondo morado para las zonas no cubiertas
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
      this.ctx.drawImage(portada,this.canvas.width/2-2*this.canvas.height/6, 0, 2*this.canvas.height/3, this.canvas.height);

    }
  
    borrarGolpes(){
      this.atackPlayerCond = false;
      this.atackOponentCond = false;
    }
  
 
    atackPlayer(time){
     // esperamos 6 segundos aprox antes de iniciar animación de ataques --> time >6000
      
      

      if(time>6000 && this.yCardPlayer>this.canvas.height/2 && this.playerAtack[0]){
        this.yCardPlayer-=5;
        
      }else{
        if(time>6000){
        this.playerAtack[0] =false;
        this.playerAtack[1] =true;
        }
      }
      if( this.yCardPlayer < 2*this.canvas.height/3 && this.playerAtack[1]){

        if(this.condGolpePlayer){ //mostramos golpe sobre el oponente una vez
          this.condGolpePlayer = false;
          this.atackPlayerCond = true;
          setTimeout(()=>{ this.borrarGolpes(); }, 300);
          
        }

        this.yCardPlayer+=5;
      }else{
        if(!this.playerAtack[0] && this.playerAtack[1] && this.cond){//cuando termina nuestro ataque empieza el del oponente
          this.oponentAtack[0]=true;
          //console.log("condicion bucle dos")
        }
      }
      // console.log("this.yCardPlayer",this.yCardPlayer)
      // console.log("segunda condicion",2*this.canvas.height/3 )
    }

    atackOponent(){
      // console.log(this.yCardOponent+this.cardLarge)
      // console.log(this.canvas.height/2)
      if( (this.yCardOponent+this.cardLarge)<this.canvas.height/2 && this.oponentAtack[0]){
        //console.log("dentro11111!!!")
        this.yCardOponent+=5;
        this.playerAtack[1] = false;
      }
        
      else{
        if(this.oponentAtack[0]){
          this.oponentAtack[0] =false;
          this.oponentAtack[1] =true; 
        }
          
      }
      if( this.yCardOponent> 0 && this.oponentAtack[1]){
        
        if(this.condGolpeOponent){ //mostramos golpe sobre el jugador una vez
          this.condGolpeOponent = false;
          this.atackOponentCond = true;
          setTimeout(()=>{ this.borrarGolpes(); }, 300);
        }

        this.cond = false;
        this.yCardOponent-=5;
      }
      // else{
      //   if(!this.oponentAtack[0]){//cuando termina nuestro ataque empieza el del oponente
      //     //terminar loop
      //   }
      // }
    }
  
    updateCanvas() {

      this.atackPlayer(Date.now()-this.initialTime);
      this.atackOponent();
    
      //Pintar fondo
  
    }
  
    clearCanvas() {
       this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  
    drawCanvas() {
  
        //dibujo cartas de jugador y de advesario     
        this.ctx.drawImage(cardPlayer,0.1*this.canvas.width, this.yCardPlayer, this.cardWidth, this.cardLarge);
        this.ctx.drawImage(cardOponent,this.canvas.width-this.cardWidth-0.1*this.canvas.width, this.yCardOponent, this.cardWidth, this.cardLarge);
      
        //muestro golpeos de jugador y adversario

        if(this.atackOponentCond){
          this.ctx.drawImage(golpe,0.1*this.canvas.width+this.cardWidth/4, 5*this.yCardPlayer/4, this.cardWidth/2, this.cardWidth/2);
        }

        if(this.atackPlayerCond){
          this.ctx.drawImage(golpe,this.canvas.width-3*this.cardWidth/4-0.1*this.canvas.width, this.yCardPlayer/4, this.cardWidth/2, this.cardWidth/2);
        }

  
    }
   
 
  

  
  }