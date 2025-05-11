import { Checkbox, CheckboxGroup, CheckboxReverse, CheckboxSection, CheckboxSelectAll } from '../src';
import './App.css';

const App = () => {
  return (
    <div className="content">
      <CheckboxGroup onChange={console.log}>
        <div className="actions">
          <label>
            <CheckboxSelectAll />
            <span>Select All</span>
          </label>
          <CheckboxReverse>Reverse</CheckboxReverse>
        </div>

        <CheckboxSection>
          <div className="actions">
            <label>
              <CheckboxSelectAll />
              <span>Fruits</span>
            </label>
            <CheckboxReverse>Reverse</CheckboxReverse>
          </div>
          <div className="section-content">
            <label>
              <Checkbox value="apple" />
              <span>🍎 apple</span>
            </label>
            <label>
              <Checkbox value="banana" />
              <span>🍌 banana</span>
            </label>
            <label>
              <Checkbox value="orange" />
              <span>🍊 orange</span>
            </label>
            <label>
              <Checkbox value="grape" />
              <span>🍇 grape</span>
            </label>
            <label>
              <Checkbox value="watermelon" />
              <span>🍉 watermelon</span>
            </label>
            <label>
              <Checkbox value="kiwi" />
              <span>🥝 kiwi</span>
            </label>
          </div>
        </CheckboxSection>

        <CheckboxSection>
          <div className="actions">
            <label>
              <CheckboxSelectAll />
              <span>Vegetables</span>
            </label>
            <CheckboxReverse>Reverse</CheckboxReverse>
          </div>
          <div className="section-content">
            <label>
              <Checkbox value="carrot" />
              <span>🥕 carrot</span>
            </label>
            <label>
              <Checkbox value="broccoli" />
              <span>🥦 broccoli</span>
            </label>
            <label>
              <Checkbox value="spinach" />
              <span>🥬 spinach</span>
            </label>
            <label>
              <Checkbox value="potato" />
              <span>🥔 potato</span>
            </label>
            <label>
              <Checkbox value="tomato" />
              <span>🍅 tomato</span>
            </label>
            <label>
              <Checkbox value="cucumber" />
              <span>🥒 cucumber</span>
            </label>
          </div>
        </CheckboxSection>

        <CheckboxSection>
          <div className="actions">
            <label>
              <CheckboxSelectAll />
              <span>Meats</span>
            </label>
            <CheckboxReverse>Reverse</CheckboxReverse>
          </div>
          <div className="section-content">
            <label>
              <Checkbox value="chicken" />
              <span>🍗 chicken</span>
            </label>
            <label>
              <Checkbox value="beef" />
              <span>🥩 beef</span>
            </label>
            <label>
              <Checkbox value="pork" />
              <span>🍖 pork</span>
            </label>
            <label>
              <Checkbox value="fish" />
              <span>🐟 fish</span>
            </label>
            <label>
              <Checkbox value="shrimp" />
              <span>🍤 shrimp</span>
            </label>
          </div>
        </CheckboxSection>
      </CheckboxGroup>
    </div>
  );
};

export default App;
