const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/* =====================================================
   CONFIGURAÇÃO DAS CAIXAS
===================================================== */

const caixas = {

  "09": {
    titulo: "🇧🇷 Caixa da Independência",
    mensagem:
      "A Caixa da Independência já está disponível para resgate."
  },

  "10": {
    titulo: "🎃 Caixa Halloween",
    mensagem:
      "A nova Caixa Halloween já está disponível para resgate."
  },

  "11": {
    titulo: "🖤 Caixa da Consciência Negra",
    mensagem:
      "A nova Caixa da Consciência Negra já está disponível para resgate."
  },

  "12": {
    titulo: "🎄 Caixa de Natal",
    mensagem:
      "A nova Caixa de Natal já está disponível para resgate."
  }

};


/* =====================================================
   NOTIFICAÇÃO DA NOVA CAIXA
===================================================== */

/*
   Executa todos os dias às 00:05.
   A função somente cria a notificação
   quando for o primeiro dia do mês.

   Timezone:
   America/Sao_Paulo
*/

exports.notificarNovaCaixa =
  functions.pubsub
    .schedule("5 0 1 * *")
    .timeZone("America/Sao_Paulo")
    .onRun(async () => {

      const agora =
        new Date();

      const mes =
        String(
          agora.getMonth() + 1
        ).padStart(
          2,
          "0"
        );

      const ano =
        agora.getFullYear();

      const caixa =
        caixas[mes];

      /*
         Se não houver Caixa programada
         para esse mês, não faz nada.
      */

      if(!caixa){

        console.log(
          "Nenhuma Caixa programada para o mês:",
          mes
        );

        return null;

      }


      console.log(
        "Iniciando notificações da Caixa:",
        caixa.titulo
      );


      /*
         Busca todos os VIPs.
      */

      const snapshot =
        await db
          .collection("admins")
          .where(
            "vip",
            "==",
            true
          )
          .get();


      if(snapshot.empty){

        console.log(
          "Nenhum VIP encontrado."
        );

        return null;

      }


      /*
         Firestore permite no máximo
         500 operações por batch.
      */

      let batch =
        db.batch();

      let quantidade =
        0;

      let batches = [];


      for(
        const documento
        of snapshot.docs
      ){

        const uid =
          documento.data().uid;


        if(!uid){

          console.log(
            "Usuário sem UID:",
            documento.id
          );

          continue;

        }


        /*
           ID único da notificação.

           Exemplo:
           caixa_2026_09_UID

           Isso impede que a mesma Caixa
           seja enviada duas vezes.
        */

        const notificacaoId =
          "caixa_" +
          ano +
          "_" +
          mes +
          "_" +
          uid;


        const referencia =
          db
            .collection("notificacoes")
            .doc(
              notificacaoId
            );


        batch.set(

          referencia,

          {

            uid:
              uid,

            titulo:
              "🎁 Nova Caixa Box disponível!",

            mensagem:
              caixa.titulo +
              " já está disponível para resgate.",

            tipo:
              "caixa",

            mes:
              mes,

            ano:
              ano,

            caixa:
              caixa.titulo,

            lida:
              false,

            criadaEm:
              admin.firestore.FieldValue.serverTimestamp()

          },

          {
            merge: false
          }

        );


        quantidade++;


        /*
           A cada 500 operações,
           fecha um batch e começa outro.
        */

        if(
          quantidade === 500
        ){

          batches.push(
            batch.commit()
          );

          batch =
            db.batch();

          quantidade =
            0;

        }

      }


      /*
         Envia o último batch.
      */

      if(
        quantidade > 0
      ){

        batches.push(
          batch.commit()
        );

      }


      await Promise.all(
        batches
      );


      console.log(
        "Notificações enviadas para:",
        snapshot.size,
        "VIPs."
      );


      return null;

    });
