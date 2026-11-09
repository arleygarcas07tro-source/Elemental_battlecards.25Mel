/**
 * Contenido estático de las reglas del juego (capa de datos de presentación).
 * Las escenas solo lo renderizan.
 */

export const GAME_RULES_HTML = `
    <ol class="rules">
        <li><strong>Objetivo de la partida:</strong>
            <ul>
                <li><strong>Modo clásico:</strong> reúne los seis elementos en tu campo y conserva el control hasta que vuelva a comenzar tu turno. También puedes ganar al completar las seis esencias elementales.</li>
                <li><strong>Modos con gemas:</strong> consigue las gemas requeridas y reúne los seis elementos en tu campo para ganar.</li>
            </ul>
        </li>

        <li><strong>Elementos y ventajas:</strong>
            <p>Los seis elementos forman dos ciclos independientes:</p>
            <h3>Ciclo de fuego, planta y agua:</h3>
            <ul>
                <li>Fuego vence a Planta.</li>
                <li>Planta vence a Agua.</li>
                <li>Agua vence a Fuego.</li>
            </ul>
            <h3>Ciclo de luz, sombra y espíritu:</h3>
            <ul>
                <li>Luz vence a Sombra.</li>
                <li>Sombra vence a Espíritu.</li>
                <li>Espíritu vence a Luz.</li>
            </ul>
            <p><strong>Entre ciclos:</strong> los elementos de un ciclo son neutrales frente a los del otro.</p>
        </li>

        <li><strong>Niveles de las cartas:</strong>
            <p>Hay tres niveles. Cada fusión combina dos cartas del mismo elemento y nivel para crear una carta del nivel siguiente.</p>
            <ul>
                <li><strong>⭐ Nivel 1:</strong> carta básica.</li>
                <li><strong>⭐⭐ Nivel 2:</strong> resultado de fusionar dos cartas de nivel 1 iguales.</li>
                <li><strong>⭐⭐⭐ Nivel 3:</strong> resultado de fusionar dos cartas de nivel 2 iguales.</li>
            </ul>
            <p><strong>Efecto del nivel en combate:</strong></p>
            <ul>
                <li>Todas las cartas tienen 100% de vida máxima, sin importar su nivel. El nivel afecta el daño, no la vida.</li>
                <li>El daño base depende del nivel del atacante y del defensor:</li>
                <li>Nivel 1 causa 5% a nivel 1, 5% a nivel 2 y 2% a nivel 3.</li>
                <li>Nivel 2 causa 25% a nivel 1, 15% a nivel 2 y 10% a nivel 3.</li>
                <li>Nivel 3 causa 50% a nivel 1, 35% a nivel 2 y 25% a nivel 3.</li>
                <li>La ventaja elemental suma 5 puntos porcentuales de daño; la desventaja resta 5 puntos.</li>
                <li>El porcentaje de daño se resta de la vida actual hasta llegar a 0%. Los bonus de esencias se suman al daño; el daño final va de 0% a 100%.</li>
                <li>La carta defensora pierde vida con cada ataque y se destruye al llegar a 0%.</li>
            </ul>
        </li>

        <li><strong>Turnos y acciones:</strong>
            <p>La partida se juega por turnos entre dos jugadores. En los modos Clásico y Gemas, cada jugador dispone de hasta <strong>dos acciones</strong> por turno:</p>
            <ul>
                <li>Colocar una carta en el campo.</li>
                <li>Atacar con una carta.</li>
                <li>Fusionar cartas si se cumplen los requisitos.</li>
            </ul>
            <p>Una fusión cuenta como una acción. Atacar también cumple la obligación de ataque del turno; si queda otra acción disponible, puedes colocar o fusionar una carta. Las acciones no utilizadas no se acumulan. El turno termina al agotar las acciones o el tiempo disponible.</p>
            <p>En Contrarreloj se dispone de una acción por turno. En el Desafío de 30 turnos se permiten hasta dos acciones por turno, con un límite de diez segundos.</p>
        </li>

        <li><strong>Regla de ataque obligatorio:</strong>
            <p>Cada jugador debe realizar al menos un ataque cada tres turnos propios. Puedes atacar antes; cada ataque reinicia el contador. Si el ataque es obligatorio, debes atacar durante ese turno.</p>
            <p><strong>Casos especiales:</strong></p>
            <ul>
                <li>Si el rival no tiene cartas en el campo para defenderse, el ataque directo puede llenar una de tus esencias elementales.</li>
                <li>Si debes atacar y no tienes cartas en el campo, tu turno se salta y el contador de ataques se reinicia.</li>
            </ul>
        </li>

        <li><strong>Campo y mano:</strong>
            <p>Cada jugador tiene seis espacios en el campo y puede ocupar cada uno con una sola carta. La partida comienza con cuatro cartas en la mano. Al colocar una carta, robas otra del mazo si todavía quedan cartas.</p>
        </li>

        <li><strong>Mazo y robos:</strong>
            <p>Cada jugador comienza con un mazo de 48 cartas: ocho de cada elemento. Cuando colocas una carta, robas otra si es posible. Si el mazo se agota, el cementerio se baraja para formar un nuevo mazo cuando haya cartas disponibles.</p>
        </li>

        <li><strong>Colocación y revelación:</strong>
            <p>Las cartas se colocan boca abajo, ocultas para el rival. Se revelan cuando atacan, son atacadas o se fusionan. Una vez reveladas, permanecen boca arriba durante el resto de la partida.</p>
        </li>

        <li><strong>Combate:</strong>
            <p>El atacante elige una de sus cartas y una carta rival como objetivo. El daño depende del nivel de la carta atacante y de la relación elemental:</p>
            <ul>
                <li>El daño base depende del nivel del atacante y del defensor, según la tabla de combate.</li>
                <li>Ventaja elemental: +5 puntos porcentuales; desventaja elemental: −5 puntos.</li>
                <li>Los elementos de ciclos distintos son neutrales. El daño final va de 0% a 100%, antes de aplicar el bonus de esencia.</li>
                <li>Una carta se destruye cuando su vida llega a 0%.</li>
            </ul>
        </li>

        <li><strong>Cartas destruidas y cementerio:</strong>
            <p>Las cartas destruidas se convierten en cartas básicas del mismo elemento y se envían al cementerio. Cuando el mazo se agota, esas cartas pueden barajarse para formar uno nuevo.</p>
        </li>

        <li><strong>Fusiones:</strong>
            <p>Puedes fusionar dos cartas del mismo elemento y nivel que estén en el campo, o fusionar una carta de tu mano con otra del mismo elemento y nivel en el campo. La fusión consume una acción, crea una carta de un nivel superior y la deja boca arriba. La vida de la carta resultante es la suma de la vida de ambas cartas, hasta un máximo de 100%.</p>
        </li>

        <li><strong>Gemas y poderes de esencia:</strong>
            <p>En los modos con gemas, cada carta de nivel 3 que entra en el campo concede <strong>una gema</strong> de su elemento, una sola vez por carta. Las gemas permanecen en el contador aunque la carta sea destruida. Las cartas de nivel 1 y 2 no generan gemas.</p>
            <p>Al activar una esencia, desbloqueas su poder. Usarlo no consume una acción, pero sí cuesta gemas del elemento correspondiente. Cada poder se puede usar una vez por turno y puede tener requisitos adicionales.</p>
            <ul>
                <li><strong>Fuego · Ráfaga</strong> (1 gema): tu próximo ataque en este turno causa 15% de daño adicional.</li>
                <li><strong>Agua · Rescate</strong> (1 gema): devuelve a tu mano la carta básica más reciente de tu cementerio. Necesitas tener una carta allí.</li>
                <li><strong>Planta · Brotar</strong> (2 gemas): roba dos cartas de tu mazo.</li>
                <li><strong>Luz · Clarividencia</strong> (1 gema): revela la mano del rival hasta que robe o juegue una carta.</li>
                <li><strong>Sombra · Robar</strong> (2 gemas): el rival descarta la carta de mayor nivel de su mano. Necesita tener cartas en la mano.</li>
                <li><strong>Espíritu · Conducto</strong> (2 gemas): bloquea la Convergencia del rival durante su próximo turno.</li>
            </ul>
        </li>

        <li><strong>Restricciones de ataque por nivel:</strong>
            <ul>
                <li>⭐ <strong>Nivel 1:</strong> puede atacar en cada turno propio.</li>
                <li>⭐⭐ <strong>Nivel 2:</strong> puede atacar dos turnos seguidos; después debe descansar un turno.</li>
                <li>⭐⭐⭐ <strong>Nivel 3:</strong> puede atacar un turno y debe descansar el siguiente.</li>
            </ul>
        </li>

        <li><strong>Esencias elementales:</strong>
            <p>Cada jugador tiene seis esencias, una por elemento, y comienzan vacías. Un ataque directo exitoso —cuando el rival no tiene cartas para defenderse— activa la esencia del elemento de la carta atacante.</p>
        </li>

        <li><strong>Límites de tiempo y turnos:</strong>
            <ul>
                <li><strong>Clásico y Gemas:</strong> cada turno dura hasta 12 segundos.</li>
                <li><strong>Contrarreloj:</strong> la partida dura un máximo de tres minutos y el reloj sigue avanzando durante los cambios de turno. Si se acaba el tiempo antes de cumplir el objetivo, ambos jugadores pierden.</li>
                <li><strong>Desafío de 30 turnos:</strong> cada jugador tiene hasta 30 turnos propios y diez segundos por turno. Quien cumpla primero el objetivo gana; si ambos agotan sus turnos sin lograrlo, ambos pierden.</li>
            </ul>
        </li>

        <li><strong>Fin de la partida:</strong>
            <p>La partida termina cuando se cumple una condición de victoria, un límite del modo o una condición de derrota:</p>
            <ul>
                <li>En el modo Clásico, reúne los seis elementos en el campo y conserva esa combinación durante el turno del rival, o activa las seis esencias.</li>
                <li>En los modos con gemas, completa las cantidades requeridas de cada elemento y reúne los seis elementos en el campo.</li>
                <li>Si un jugador permanece inactivo durante tres turnos propios consecutivos, pierde por inactividad.</li>
            </ul>
        </li>

        <li><strong>Modos de juego:</strong>
            <ul>
                <li><strong>Clásico:</strong> juega sin objetivos de gemas ni límite de duración.</li>
                <li><strong>Gemas:</strong> reúne las gemas requeridas y los seis elementos en el campo; no hay límite de tiempo.</li>
                <li><strong>Contrarreloj:</strong> cumple el objetivo de gemas y de campo antes de que terminen los tres minutos. Dispones de una acción por turno.</li>
                <li><strong>Desafío de 30 turnos:</strong> cumple el objetivo de gemas y de campo antes de agotar tus 30 turnos, con diez segundos para actuar en cada uno.</li>
            </ul>
        </li>
    </ol>
`;

/** Guía visual resumida; el reglamento completo permanece debajo. */
export const GAME_TUTORIAL_HTML = `
    <section class="tutorial" aria-labelledby="tutorial-title">
        <div class="tutorial-heading">
            <div>
                <span class="tutorial-kicker">Aprende jugando</span>
                <h3 id="tutorial-title">La partida, paso a paso</h3>
            </div>
            <span class="tutorial-caption">Guía rápida antes del reglamento completo</span>
        </div>
        <div class="tutorial-steps">
            <article class="tutorial-step step-opening">
                <div class="step-number">01</div>
                <div class="step-art opening-art" aria-hidden="true">
                    <div class="mini-deck"><span>48</span><i>cartas</i></div><div class="opening-arrow">→</div>
                    <div class="mini-hand"><b>4</b><span>🂠</span><span>🂠</span><span>🂠</span><span>🂠</span></div>
                    <div class="field-slots"><i></i><i></i><i></i><i></i><i></i><i></i></div>
                </div>
                <h4>Prepara tu campo</h4>
                <p>Cada jugador inicia con 48 cartas, 4 en la mano y 6 espacios. Al colocar una carta, robas otra si queda mazo.</p>
            </article>
            <article class="tutorial-step step-turn">
                <div class="step-number">02</div>
                <div class="step-art turn-art" aria-hidden="true">
                    <div class="action-token"><b>1</b><span>acción</span></div><div class="turn-path"><i></i><i></i><i></i></div>
                    <div class="action-token second"><b>2</b><span>acción</span></div>
                </div>
                <h4>Usa tus acciones</h4>
                <p>En Clásico y Gemas tienes hasta 2 acciones: colocar, atacar o fusionar. Ataca al menos una vez cada 3 turnos propios.</p>
            </article>
            <article class="tutorial-step step-cycle">
                <div class="step-number">03</div>
                <div class="step-art cycle-art" aria-label="Fuego vence a Planta, Planta vence a Agua y Agua vence a Fuego">
                    <div class="cycle-row"><span class="element-chip fire">🔥 Fuego</span><b>vence a</b><span class="element-chip plant">🌿 Planta</span></div>
                    <div class="cycle-row"><span class="element-chip plant">🌿 Planta</span><b>vence a</b><span class="element-chip water">💧 Agua</span></div>
                    <div class="cycle-row"><span class="element-chip water">💧 Agua</span><b>vence a</b><span class="element-chip fire">🔥 Fuego</span></div>
                </div>
                <h4>Elige bien el objetivo</h4>
                <p>La ventaja elemental suma 5 puntos porcentuales de daño y la desventaja resta 5. El segundo ciclo es Luz → Sombra → Espíritu → Luz; entre ciclos hay neutralidad.</p>
            </article>
            <article class="tutorial-step step-fusion">
                <div class="step-number">04</div>
                <div class="step-art fusion-art" aria-hidden="true">
                    <div class="rank-card"><img src="/assets/images/cartas/carta-fuego-1.jpeg" alt=""><span>★</span></div>
                    <b class="fusion-plus">+</b><div class="rank-card"><img src="/assets/images/cartas/carta-fuego-1.jpeg" alt=""><span>★</span></div>
                    <b class="fusion-arrow">→</b><div class="rank-card upgraded"><img src="/assets/images/cartas/carta-fuego-2.jpeg" alt=""><span>★★</span></div>
                </div>
                <h4>Fusiona iguales</h4>
                <p>Combina 2 cartas del mismo elemento y nivel (campo + campo o mano + campo). Cuesta 1 acción y crea el nivel siguiente boca arriba.</p>
            </article>
            <article class="tutorial-step step-gems">
                <div class="step-number">05</div>
                <div class="step-art gem-art" aria-hidden="true">
                    <div class="rank-card level-three"><img src="/assets/images/cartas/carta-agua-3.jpeg" alt=""><span>★★★</span></div>
                    <b class="gem-arrow">→</b><div class="gem-orb">💎<small>+1</small></div><div class="essence-orb">💧<small>Rescate</small></div>
                </div>
                <h4>Activa esencias y poderes</h4>
                <p>Un ataque directo activa la esencia. En modos con gemas, una carta de nivel 3 genera 1 gema elemental. Los poderes no gastan acción, pero cuestan gemas.</p>
            </article>
            <article class="tutorial-step step-victory">
                <div class="step-number">06</div>
                <div class="step-art victory-art" aria-hidden="true">
                    <div class="victory-elements"><i>💧</i><i>🔥</i><i>🌿</i><i>✨</i><i>🌑</i><i>👻</i></div>
                    <div class="victory-line"></div><strong>¡VICTORIA!</strong>
                </div>
                <h4>Completa el objetivo</h4>
                <p>Reúne los 6 elementos y conserva el control durante el turno rival; o activa las 6 esencias en Clásico. En modos con gemas, completa también su objetivo.</p>
            </article>
        </div>
        <p class="tutorial-note">Las cartas reveladas quedan boca arriba. Las destruidas pasan al cementerio como cartas básicas; al agotarse el mazo, el cementerio se baraja para formar uno nuevo.</p>
    </section>
`;
