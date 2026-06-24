1jWAFC8CIPSUFu4bEOlKk-UYjxX0aFrn_Nz4NpdOiCT0

necesito que crees el codigo para una pagina web que permita las siguientes funciones:
1 pagina principal para mostrar los productos disponibles con toda su info, mostrando tambien los san disponibles con toda su info ambos incluyendo su imagen, boton para inciar seccion como cliente y icono de llave para inciar seccion como administrador.
2 la pagina de clientes debe mostrar los sanes donde estan participando mostrandoles los pagos que llevan y los que les faltan ademas de mostrarle los sanes activos y los productos en oferta para que puedan enviar solicitudes a la patrona 
3 la pagina de admid debe permitir administrar los clientes, sanes, productos y las solicitudes de nuevos clientes y las de los clientes ya registrados
4 los sanes deben de administrar las fechas de manera automatica estas fechas se definen al momento de su creacion al alcanzar la fecha limite cada participante se le cobra el monto del san y al turno correspondiente se le paga el premio ya sea el monto o el producto dependiendo del san a jugar
5 cada san al momento de su creacion se le debe de definir el nombre la imagen la fecha desde el calendario para mas comodidad el monto y la cantidad de puestos
6 la patrona debe poder asignar turnos cambiarlos o quitarlos en cada san 
7 la patrona debe poder cambiar las claves y verlas desde su panel
8 la patrona debe tener total control sobre los productos 

que se conecte a una base de datos en docs google desde donde corra un script de google para el que tambien debes crear el codigo 

la base de datos para este proyecto tiene la siguiente estrucctura separada por pesatanas segun se crearon
Sanes: (ID, nombre, cuota, fecha, turnos, estado, ciclo, imagen).

Clientes: (ID, nombre completo, teléfono, contraseña de 4 dígitos).

Registros_de_turnos: (ID registro, ID san, ID cliente, número turno, fecha límite, estado pago, comprobante).

Solicitudes_Nuevos: (ID solicitud, nombre completo, teléfono, ID san, turno deseado).

Solicitudes_Inscritos: (ID propuesta, ID cliente, ID san, fecha solicitud, turno deseado).

Productos: (ID producto, nombre, descripción, precio, imagen, stock, estado).

todo el codigo esta en github y corre desde vercel
estetica premium fluida con el color predominante morado
haz lo que tengas que hacer para que funcione todo esto y no te limites a un solo documento podemos crear lo que necesites para que funcione sin errores y este ordenado