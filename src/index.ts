import Paw from "./types-paw-api/paw";
import xmldom from "xmldom";

const xpath = require("./lib/xpath2");

class XPath2Evaluator implements Paw.DynamicValuePlugin {
  static identifier = "com.yanysh.Paw.XPath2Evaluator";
  static title = "XPath 2.0";
  static help = "https://github.com/Drenalol/Paw-XPath2DynamicValue";
  static inputs = [
    InputField("depthRequestPath", "Depth path of request", "Number", {
      defaultValue: 0,
      minValue: 0
    }),
    InputField("showXPathInName", "Show XPath", "Checkbox", {
      defaultValue: true
    }),
    InputField("request", "Source Request", "Request"),
    InputField("xpath", "XPath (Support 2.0)", "String"),
    InputField("namespaces", "Namespaces", "KeyValueList", {
      keyName: "prefix",
      valueName: "uri"
    })
  ];

  depthRequestPath: number;
  showXPathInName: boolean;
  request: Paw.Request;
  xpath: string;
  namespaces: any[][];

  public evaluate(context: Paw.Context): string {
    const xmlBody = this.request.getLastExchange()?.responseBody;

    if (!xmlBody || !this.xpath)
      return "";

    const document = new xmldom.DOMParser().parseFromString(xmlBody, "application/xml");

    let namespaceResolver: XPathNSResolver | undefined = undefined;

    if (this.namespaces.length > 0) {
      const namespaces = this.namespaces
        .filter(namespace => namespace[2] === true)
        .reduce((acc, next) => {
          return {...acc, [next[0]]: next[1]}
        }, {} as Record<string, string>);

      namespaceResolver = (prefix: string): string => namespaces[prefix];
    }

    const evaluateResult = xpath.evaluate(this.xpath, document, namespaceResolver);
    let evaluateInnerXml = "";

    while (true) {
      const node = evaluateResult.iterateNext();

      if (node == null)
        break;

      evaluateInnerXml = evaluateInnerXml.concat(node.toString());
    }

    return evaluateInnerXml;
  }

  public title(context: Paw.Context): string {
    if (!this.request)
      return "";

    let currentDepth = 0;
    let fullPath: string[] = this.request.name
      ? [this.request.name]
      : [];
    let node = this.request.parent;

    while (currentDepth < this.depthRequestPath) {
      if (node) {
        if (node.name)
          fullPath.push(node.name);

        node = node.parent;
      } else {
        break;
      }
      currentDepth++;
    }

    return fullPath.reverse().join("-");
  }

  public text(context: Paw.Context): string {
    if (this.showXPathInName)
      return this.xpath;

    return "";
  }
}

registerDynamicValueClass(XPath2Evaluator)
