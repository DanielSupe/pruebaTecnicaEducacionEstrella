/**
 * Trigger de pre-registro de Cognito.
 *
 * Confirma al solicitante en el momento del registro, pero NO marca su correo como
 * verificado: marcarlo seria afirmar que alguien comprobo algo que nadie comprobo.
 *
 * Por que existe: todos los datos de esta prueba son ficticios, asi que exigir un
 * codigo por correo obligaria a que le llegue un email real al evaluador el dia de
 * la demostracion, con el tope de 50 envios diarios del emisor por omision de
 * Cognito. En produccion se mantendria la verificacion y se anadiria proteccion
 * contra registros abusivos.
 */
export const handler = async (event) => {
  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = false;
  event.response.autoVerifyPhone = false;
  return event;
};
