export default function TextSelector({ onTextSelect }) {
  const handleTextSelect = (e) => {
    const selectedText = window.getSelection().toString();
    if (selectedText) {
      onTextSelect(selectedText);
    }
  };

  return (
    <div className="text-selector" onMouseUp={handleTextSelect}>
      <p>点击选中合同文本中的任意部分。</p>
    </div>
  );
}
