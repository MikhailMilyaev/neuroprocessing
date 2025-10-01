import React from "react";
import styles from "./Basics.module.css";

export default function Basics() {
  return (
    <main className={styles.page}>
      {/* Sticky TOC */}
      <aside className={styles.toc} aria-label="Оглавление">
        <div className={styles.tocInner}>
          <div className={styles.tocTitle}>Оглавление</div>
          <nav>
            <a className={styles.tocLink} href="#intro">1. Введение</a>
            <a className={styles.tocLink} href="#algo">2. Описание алгоритма</a>
            <div className={styles.tocSub}>
              <a className={styles.tocLink} href="#step-21">2.1 Формулировка проблемы</a>
              <a className={styles.tocLink} href="#step-22">2.2 Детальное описание истории</a>
              <a className={styles.tocLink} href="#step-23">2.3 Фиксированные идеи</a>
              <a className={styles.tocLink} href="#step-24">2.4 Оценка «заряда» 0–10</a>
              <a className={styles.tocLink} href="#step-25">2.5 Переоценка идей</a>
            </div>
            <a className={styles.tocLink} href="#repeats">3. Повторные переоценки</a>
            <div className={styles.tocSub}>
              <a className={styles.tocLink} href="#sec-31">3.1 Интервалы: активная история</a>
              <a className={styles.tocLink} href="#sec-32">3.2 Интервалы: архивная история</a>
              <a className={styles.tocLink} href="#sec-33">3.3 Перечитывание перед переоценкой</a>
            </div>
            <a className={styles.tocLink} href="#viz">4. Визуализация прогресса</a>
            <a className={styles.tocLink} href="#end">5. Заключение</a>
            <a className={styles.tocLink} href="#refs">6. Источники литературы</a>
          </nav>
        </div>
      </aside>

      {/* Article */}
      <article className={styles.article}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            Neuroprocessing: Пошаговый алгоритм психологической самопомощи
          </h1>
          <p className={styles.lead}>
            Полная версия теории с научными обоснованиями, ссылками на исследования и примерами.
          </p>
        </header>

        {/* 1. Введение */}
        <section id="intro" className={styles.section}>
          <h2>1. Введение</h2>
          <p>
            Каждый человек сталкивается с ситуациями, когда застревает в негативных мыслях и
            эмоциях. <strong>Neuroprocessing</strong> – это научно обоснованный алгоритм самопомощи,
            разработанный для самостоятельной проработки внутренних психологических проблем. Метод
            сочетает проверенные техники когнитивно-поведенческой терапии (КПТ), экспрессивного
            письма и данные нейронауки, чтобы помочь «переработать» трудные воспоминания и убеждения
            без участия терапевта. Цель – снизить эмоциональный накал болезненных переживаний и
            {/* изменить глубинные негативные убеждения, мешающие жизни. :contentReference[oaicite:0]{index=0} */}
          </p>
          <p>
            Алгоритм разбит на понятные шаги: от осознания проблемы и выражения чувств до
            постепенной переоценки автоматических мыслей. Каждый шаг опирается на исследования –
            от важности формулировки проблемы до того, как повторные пересмотры истории помогают
            долговременно закрепить изменения. Вы находите структурированный план работы и становитесь
            активным участником собственных изменений. :contentReference 
          </p>
        </section>

        {/* 2. Описание алгоритма */}
        <section id="algo" className={styles.section}>
          <h2>2. Описание алгоритма Neuroprocessing</h2>

          {/* 2.1 */}
          <section id="step-21" className={styles.subsection}>
            <h3>2.1. Формулировка проблемы своими словами</h3>
            <p>
              Первый шаг – ясно сформулировать одну конкретную трудность одной фразой: «Я боюсь
              попросить о помощи на работе», «Меня задевает критика близких», «После конфликтов с
              партнёром чувствую отчаяние». Чёткое именование снижает неопределённость и повышает
              чувство контроля; это критически важный старт любых изменений. :contentReference
            </p>
            <div className={styles.note}>
              <strong>Коротко по науке.</strong> Когда клиент сам определяет и озвучивает проблему,
              эффективность последующей работы возрастает; формулирование повышает агентность и
              переводит «хаос» в область сознательного анализа. :contentReference
            </div>
            <div className={styles.example}>
              <strong>Пример.</strong> «Боюсь просить помощи на работе». Страх 7/10, подспудная мысль:
              «Не имею права ошибаться».
            </div>
          </section>

          {/* 2.2 */}
          <section id="step-22" className={styles.subsection}>
            <h3>2.2. Детальное описание истории: мысли, эмоции, ощущения</h3>
            <p>
              Опишите ситуацию максимально подробно – внешние факты и внутренние реакции: мысли,
              эмоции, телесные ощущения, всплывающие ассоциации. Важно включать даже нелогичные и
              «не по теме» фрагменты: часто они указывают на более ранние слои опыта. Такая полная
              «голограмма» помогает выявить сеть элементов, поддерживающих напряжение. :contentReference 
            </p>
            <p>
              Экспрессивная запись сама по себе снижает накал и повышает управляемость: вербализация
              чувств уменьшает реактивность миндалины и активирует зоны контроля. Вы смотрите на опыт
              со стороны, придаёте ему смысл, создаёте базу для следующих шагов. :contentReference 
            </p>
            <div className={styles.example}>
              <strong>Мини-пример.</strong> «Сердце колотилось», «мысль: “меня уволят”», «вспомнил
              школу, где высмеяли ответ», «стыд 8/10». :contentReference 
            </div>
          </section>

          {/* 2.3 */}
          <section id="step-23" className={styles.subsection}>
            <h3>2.3. Выявление и запись фиксированных идей (автоматических убеждений)</h3>
            <p>
              <strong>Фиксированная идея</strong> — ригидная когнитивно-эмоциональная конструкция,
              которая «застряла» и автоматически воспроизводится вне исходного контекста. В методике
              мы переводим мысли в директивную форму (как правило/приказ): «ты должен…», «тебе
              нельзя…», «если …, то …». Это делает структуру автоматизма явной и готовит к переоценке. :contentReference
            </p>
            <ul className={styles.bullets}>
              <li>
                Директивная форма обнажает «правило поведения» – видно, какое действие мысль
                навязывает. :contentReference
              </li>
              <li>
                Перевод во «второе лицо» экстернализует мысль (как «чужой голос»), снижая её захват. :contentReference
              </li>
              <li>
                Само называние активирует контрольные зоны и уменьшает эмоциональный заряд. :contentReference 
              </li>
            </ul>
            <div className={styles.example}>
              <strong>Мини-пример.</strong> «Тебе нельзя просить помощи», «Если тебя критикуют —
              ты никчёмный». :contentReference 
            </div>
          </section>

          {/* 2.4 */}
          <section id="step-24" className={styles.subsection}>
            <h3>2.4. Оценка психо-эмоционального «заряда» по шкале 0–10</h3>
            <p>
              Используем шкалу <em>SUDS</em>: 0 — спокойно; 10 — максимум напряжения. Число фиксируем
              для каждой идеи до/после проходов. Это превращает субъективное переживание в метрику,
              задаёт приоритеты и мотивирует за счёт видимой динамики. :contentReference 
            </p>
            <div className={styles.example}>
              <strong>Мини-пример.</strong> «Нельзя ошибаться» — 9/10; «Надо справляться самому» —
              7/10. :contentReference 
            </div>
            <div className={styles.note}>
              <strong>Коротко по науке.</strong> SUDS коррелирует с физиологическими маркерами
              возбуждения и широко применяется в КПТ/экспозиционных протоколах; сам мониторинг
              усиливает чувство контроля. :contentReferenc 
            </div>
          </section>

          {/* 2.5 */}
          <section id="step-25" className={styles.subsection}>
            <h3>2.5. Когнитивная переоценка фиксированных идей</h3>
            <p>
              Цель — довести «заряд» каждой идеи до 0 и лишить её автоматического влияния.
              Практически это серия осознанных возвратов к идее с фиксацией текущего «заряда»
              (0–10). После 3–4 циклов около 80% идей в типичных историях обнуляются; оставшиеся
              «упрямые» дорабатываются дополнительными практиками. :contentR 
            </p>
            <p>
              Эффективность опирается на когнитивное переосмысление, габитуацию/экспозиционное
              обучение и механизмы реконсолидации памяти: при повторной реактивации след становится
              лабильным и поддаётся обновлению, если опыт безопасен и устойчиво фиксируется как
              «нулевой» отклик. :contentReference
            </p>
            <div className={styles.example}>
              <strong>Мини-пример.</strong> «Если критикуют — я никчёмный»: 8/10 → 5/10 → 2/10 → 0/10.
              Уходят импульсивные реакции, появляется выбор. :contentReference
            </div>
            <div className={styles.note}>
              <strong>Практический ориентир.</strong> Обнуляйте идеи по очереди; «жёсткие» часто
              поддерживаются несколькими «играми» в разных сферах жизни — для них полезны распределённые
              повторы и специальные практики. :contentReference
            </div>
          </section>
        </section>

        {/* 3. Повторные переоценки и управление прогрессом */}
        <section id="repeats" className={styles.section}>
          <h2>3. Повторные переоценки и управление прогрессом</h2>

          <section id="sec-31" className={styles.subsection}>
            <h3>3.1. Интервалы переоценок (активная история)</h3>
            <p>
              Используем сочетание <strong>массированных</strong> проходов (несколько повторов подряд
              в сессии) для быстрого снижения и <strong>распределённых</strong> повторов (с интервалами
              от дней до недель) для стойкости эффекта и меньшего риска возврата реакции. :contentReference
            </p>
          </section>

          <section id="sec-32" className={styles.subsection}>
            <h3>3.2. Интервалы переоценок (архивная история)</h3>
            <p>
              После полного обнуления история архивируется. Контрольные проверки: через 1–2 недели,
              месяц, 2–3 месяца. Если любая идея снова даёт отклик &gt; 0, история возвращается в
              актив и дорабатывается. Так поддерживается долговременная устойчивость изменений. :contentReference
            </p>
          </section>

          <section id="sec-33" className={styles.subsection}>
            <h3>3.3. Перечитывание всей истории перед повторной переоценкой</h3>
            <p>
              Перед новой оценкой перечитывайте первоначальный текст истории: это полноценно
              реактивирует память, создаёт «окно пластичности», повышает точность внимания, улучшает
              связность нарратива и открывает новые инсайты. :contentReference
            </p>
          </section>
        </section>

        {/* 4. Визуализация прогресса */}
        <section id="viz" className={styles.section}>
          <h2>4. Визуализация прогресса</h2>
          <p>
            Числа «до/после» превращают переживания в управляемую метрику. Видна реальная динамика:
            идеи, казавшиеся «неподвижными», постепенно обнуляются и уходят в архив; это поддерживает
            мотивацию и чувство контроля. :contentReference 
          </p>
        </section>

        {/* 5. Заключение */}
        <section id="end" className={styles.section}>
          <h2>5. Заключение</h2>
          <p>
            Neuroprocessing систематизирует доказательные подходы и переводит их в прозрачный
            алгоритм: сбор полной «голограммы» идей —&gt; директивная запись —&gt; измерение
            «заряда» —&gt; итеративные переоценки до нуля —&gt; архивирование и распределённые
            проверки. Это формирует устойчивый метанавык распознавать автоматизмы ума, выносить их
            «наружу», измерять и разряжать. Не является заменой клинической помощи при острых
            состояниях. :contentReference
          </p>
        </section>

        {/* 6. Источники */}
        <section id="refs" className={styles.section}>
          <h2>6. Источники литературы</h2>
          <ol className={styles.refs}>
            <li>Yao, X., &amp; Dong, B. (2022). Formulation and Clients’ Agency in CBT. Frontiers in Psychology, 13:810437. DOI: <a href="https://doi.org/10.3389/fpsyg.2022.810437">10.3389/fpsyg.2022.810437</a></li>
            <li>Pennebaker, J.W. (1997). Writing about emotional experiences as a therapeutic process. <em>Psychological Science</em>, 8(3), 162–166. DOI: <a href="https://doi.org/10.1111/j.1467-9280.1997.tb00403.x">10.1111/j.1467-9280.1997.tb00403.x</a></li>
            <li>Frattaroli, J. (2006). Experimental disclosure and its moderators: a meta-analysis. <em>Psychological Bulletin</em>, 132(6), 823–865. DOI: <a href="https://doi.org/10.1037/0033-2909.132.6.823">10.1037/0033-2909.132.6.823</a></li>
            <li>Lieberman, M.D., et al. (2007). Putting feelings into words… <em>Psychological Science</em>, 18(5), 421–428. DOI: <a href="https://doi.org/10.1111/j.1467-9280.2007.01916.x">10.1111/j.1467-9280.2007.01916.x</a></li>
            <li>Beck, A.T. (1976). <em>Cognitive Therapy and the Emotional Disorders</em>. NY: IUP.</li>
            <li>Wolpe, J. (1969). <em>The Practice of Behavior Therapy</em>. Pergamon Press.</li>
            <li>Urcelay, G.P., &amp; Miller, R.R. (2010). Spacing extinction trials… <em>Learning &amp; Behavior</em>, 37(1), 60–73. DOI: <a href="https://doi.org/10.3758/LB.37.1.60">10.3758/LB.37.1.60</a></li>
            <li>Botella, C. et al. (2010). Internet self-help for fear of public speaking. <em>Cyberpsychology, Behavior, and Social Networking</em>, 13(4), 407–421. DOI: <a href="https://doi.org/10.1089/cyber.2009.0224">10.1089/cyber.2009.0224</a></li>
            <li>Mattera, E.F. et al. (2025). Rethinking SUDS. <em>Clinics and Practice</em>, 15(7):123. DOI: 10.3390/clinicpract15070123</li>
            <li>Gross, J.J. (2002). Emotion regulation… <em>Psychophysiology</em>, 39(3), 281–291. DOI: <a href="https://doi.org/10.1017/S0048577201393198">10.1017/S0048577201393198</a></li>
            <li>Lane, R.D. et al. (2015). Memory reconsolidation… <em>Behavioral and Brain Sciences</em>, 38, e1. DOI: <a href="https://doi.org/10.1017/S0140525X14000041">10.1017/S0140525X14000041</a></li>
            <li>Moser, J.S., Cahill, S.P., &amp; Foa, E.B. (2010). Negative cognitions &amp; outcomes… <em>J. Nerv. Ment. Dis.</em>, 198(1), 72–75. DOI: <a href="https://doi.org/10.1097/NMD.0b013e3181c81fac">10.1097/NMD.0b013e3181c81fac</a></li>
            <li>Kahneman, D. (2011). <em>Thinking, Fast and Slow</em>. Farrar, Straus and Giroux.</li>
            <li>Foa, E.B., &amp; Rauch, S.A. (2004). Cognitive change during PE vs PE+CR… <em>JCCP</em>, 72(5), 879–884. DOI: <a href="https://doi.org/10.1037/0022-006X.72.5.879">10.1037/0022-006X.72.5.879</a></li>
            <li>Heim, G., &amp; Bühler, K.E. (2006). Janet’s fixed ideas. <em>American Journal of Psychotherapy</em>, 60(2), 111–129. DOI: <a href="https://doi.org/10.1176/appi.psychotherapy.2006.60.2.111">10.1176/appi.psychotherapy.2006.60.2.111</a></li>
            <li>Craske, M.G. et al. (2008). Continuous vs distributed exposure? <em>JCCP</em>, 76(3), 462–467. DOI: <a href="https://doi.org/10.1037/0022-006X.76.3.462">10.1037/0022-006X.76.3.462</a></li>
            <li>Rowe, M.K., &amp; Craske, M.G. (1998). Spaced vs massed exposure. <em>BRT</em>, 36(7–8), 701–717. DOI: <a href="https://doi.org/10.1016/S0005-7967(97)10016-X">10.1016/S0005-7967(97)10016-X</a></li>
            <li>Barlow, D.H. (2002). <em>Anxiety and Its Disorders</em> (2nd ed.). Guilford Press.</li>
            <li>Monfils, M.H. et al. (2009). Extinction-reconsolidation boundaries. <em>Science</em>, 324, 951–955. DOI: <a href="https://doi.org/10.1126/science.1167975">10.1126/science.1167975</a></li>
            <li>van Emmerik, A.A. et al. (2002). Debriefing after trauma: meta-analysis. <em>Lancet</em>, 360, 766–771. DOI: <a href="https://doi.org/10.1016/S0140-6736(02)09897-5">10.1016/S0140-6736(02)09897-5</a></li>
            <li>Cepeda, N.J. et al. (2008). Spacing effects… <em>Psychological Science</em>, 19(11), 1095–1102. DOI: <a href="https://doi.org/10.1111/j.1467-9280.2008.02209.x">10.1111/j.1467-9280.2008.02209.x</a></li>
            <li>Fivush, R. (2010). Development of autobiographical memory. <em>Ann. Rev. Psych.</em>, 62, 559–582. DOI: <a href="https://doi.org/10.1146/annurev.psych.121208.131702">10.1146/annurev.psych.121208.131702</a></li>
            <li>Nishith, P. et al. (2002). Psychotherapy for chronic PTSD… <em>JAMA</em>, 288(14), 189–196. DOI: <a href="https://doi.org/10.1001/jama.288.14.189">10.1001/jama.288.14.189</a></li>
            <li>Kapoula, Z. et al. (2010). EMDR &amp; eye movements. <em>PLoS ONE</em>, 5(5):e10762. DOI: <a href="https://doi.org/10.1371/journal.pone.0010762">10.1371/journal.pone.0010762</a></li>
            <li>Janet, P. (1925). <em>Principles of Psychotherapy</em>. London: Allen &amp; Unwin.</li>
            <li>Beck, J.S. (2011). <em>CBT: Basics and Beyond</em> (2nd ed.). Guilford Press.</li>
          </ol>
        </section>

        <footer className={styles.footerNote}>
          Материал предназначен для самостоятельной работы и не заменяет клиническую помощь.
          При рисках для безопасности приоритет — обращение к специалисту.
        </footer>
      </article>
    </main>
  );
}
