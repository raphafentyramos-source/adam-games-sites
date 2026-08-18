const {
  onCall,
  HttpsError
} = require("firebase-functions/v2/https");

const {
  initializeApp
} = require("firebase-admin/app");

const {
  getFirestore,
  Timestamp
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

const HORAS_CAIXA = 72;


/*
=====================================================
RESGATAR CAIXA BOX
=====================================================
*/

exports.resgatarCaixa = onCall(
  async (request) => {

    /*
    -------------------------------------------------
    1. VERIFICAR LOGIN
    -------------------------------------------------
    */

    if (!request.auth) {

      throw new HttpsError(
        "unauthenticated",
        "Você precisa estar logado."
      );

    }


    const uid = request.auth.uid;


    /*
    -------------------------------------------------
    2. LOCALIZAR CADASTRO
    -------------------------------------------------
    */

    const admins =
      db.collection("admins");


    const snapshot =
      await admins
        .where(
          "uid",
          "==",
          uid
        )
        .limit(1)
        .get();


    if (snapshot.empty) {

      throw new HttpsError(
        "not-found",
        "Cadastro do usuário não encontrado."
      );

    }


    const usuarioRef =
      snapshot.docs[0].ref;


    const usuario =
      snapshot.docs[0].data();


    /*
    -------------------------------------------------
    3. VERIFICAR VIP
    -------------------------------------------------
    */

    if (usuario.vip !== true) {

      throw new HttpsError(
        "permission-denied",
        "A Caixa Box é exclusiva para membros VIP."
      );

    }


    /*
    -------------------------------------------------
    4. VERIFICAR SE JÁ EXISTE UMA ESPERA
    -------------------------------------------------
    */

    const agora =
      Date.now();


    let proximaChance = null;


    if (
      usuario.proximaChance &&
      typeof usuario.proximaChance.toMillis ===
        "function"
    ) {

      proximaChance =
        usuario.proximaChance.toMillis();

    }


    /*
    Ainda não chegou a hora.
    */

    if (
      proximaChance &&
      agora < proximaChance
    ) {

      throw new HttpsError(
        "failed-precondition",
        "Sua próxima chance ainda não está disponível.",
        {
          proximaChance:
            proximaChance,

          restante:
            proximaChance - agora
        }
      );

    }


    /*
    -------------------------------------------------
    5. CALCULAR NOVAS 72 HORAS
    -------------------------------------------------
    */

    const proxima =
      new Date(
        agora +
        (
          HORAS_CAIXA *
          60 *
          60 *
          1000
        )
      );


    const proximaTimestamp =
      Timestamp.fromDate(
        proxima
      );


    /*
    -------------------------------------------------
    6. TRANSACTION
    -------------------------------------------------

    A transaction evita dois cliques/resgates
    simultâneos.
    */

    await db.runTransaction(
      async transaction => {

        const documento =
          await transaction.get(
            usuarioRef
          );


        const dados =
          documento.data();


        let proximaAtual = null;


        if (
          dados.proximaChance &&
          typeof dados.proximaChance.toMillis ===
            "function"
        ) {

          proximaAtual =
            dados.proximaChance.toMillis();

        }


        /*
        Reconfere dentro da transaction.
        */

        if (
          proximaAtual &&
          Date.now() < proximaAtual
        ) {

          throw new HttpsError(
            "failed-precondition",
            "Sua chance ainda não está disponível."
          );

        }


        transaction.update(
          usuarioRef,
          {

            ultimaCaixaResgatadaEm:
              Timestamp.now(),

            proximaChance:
              proximaTimestamp,

            caixaBox:
              true

          }
        );

      }
    );


    /*
    -------------------------------------------------
    7. REGISTRAR HISTÓRICO
    -------------------------------------------------
    */

    await db
      .collection("historico")
      .add({

        usuarioId:
          uid,

        tipo:
          "caixa_box",

        acao:
          "resgate",

        caixa:
          "Independência",

        registradoEm:
          Timestamp.now()

      });


    /*
    -------------------------------------------------
    8. RETORNO PARA O SITE
    -------------------------------------------------
    */

    return {

      sucesso:
        true,

      proximaChance:
        proximaTimestamp.toMillis(),

      mensagem:
        "Caixa Box resgatada com sucesso."

    };

  }
);
